const fs = require('fs');
const express = require('express');
const { authenticator } = require('otplib');
const session = require('./browser/session');
const equipamentos = require('./se7en/equipamentos');
const tickets = require('./se7en/tickets');
const secrets = require('./secrets');
const { audit } = require('./logger');

const PORT = process.env.PORT || 3002;
const SHARED_KEY = process.env.ROBOT_SHARED_KEY;

if (!SHARED_KEY || SHARED_KEY.includes('troque-por-uma-chave')) {
  console.error(
    '[se7en-robot] ROBOT_SHARED_KEY nao configurada (ou ainda no valor de exemplo) no .env. ' +
      'Gere uma chave forte antes de subir o servico.'
  );
  process.exit(1);
}

const app = express();
app.use(express.json());

// So aceita chamadas locais com a chave compartilhada certa.
app.use((req, res, next) => {
  const remote = req.socket.remoteAddress || '';
  const isLocal = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1';
  if (!isLocal) {
    return res.status(403).json({ erro: 'Acesso permitido so a partir do localhost.' });
  }
  if (req.headers['x-robot-key'] !== SHARED_KEY) {
    return res.status(401).json({ erro: 'Chave invalida.' });
  }
  next();
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/equipamentos/:serial', async (req, res) => {
  const { serial } = req.params;
  try {
    const detalhe = await session.withPage((page) => equipamentos.buscarPorSerial(page, serial));
    audit({ acao: 'buscar', serial, ok: true });
    res.json({ ok: true, detalhe });
  } catch (err) {
    audit({ acao: 'buscar', serial, ok: false, erro: err.message });
    res.status(500).json({ ok: false, erro: err.message });
  }
});

app.post('/equipamentos/:serial/associar', async (req, res) => {
  const { serial } = req.params;
  const { cnpj } = req.body || {};
  if (!cnpj) return res.status(400).json({ ok: false, erro: 'Informe "cnpj" no corpo da requisicao.' });

  try {
    const resultado = await session.withPage((page) => equipamentos.associar(page, serial, cnpj));
    audit({ acao: 'associar', serial, cnpj, ...resultado });
    res.json(resultado);
  } catch (err) {
    audit({ acao: 'associar', serial, cnpj, ok: false, erro: err.message });
    res.status(500).json({ ok: false, erro: err.message });
  }
});

app.post('/equipamentos/:serial/desassociar', async (req, res) => {
  const { serial } = req.params;
  try {
    const resultado = await session.withPage((page) => equipamentos.desassociar(page, serial));
    audit({ acao: 'desassociar', serial, ...resultado });
    res.json(resultado);
  } catch (err) {
    audit({ acao: 'desassociar', serial, ok: false, erro: err.message });
    res.status(500).json({ ok: false, erro: err.message });
  }
});

app.get('/tickets/tipos', (req, res) => {
  res.json({ ok: true, tipos: tickets.TIPOS_SOLICITACAO, fornecedores: tickets.FORNECEDORES });
});

app.get('/estabelecimentos/buscar', async (req, res) => {
  const termo = req.query.q;
  if (!termo) return res.status(400).json({ ok: false, erro: 'Informe "q" na query string.' });
  try {
    const opcoes = await session.withPage((page) => tickets.buscarEstabelecimentos(page, termo));
    audit({ acao: 'buscar_estabelecimento', termo, ok: true, total: opcoes.length });
    res.json({ ok: true, opcoes });
  } catch (err) {
    audit({ acao: 'buscar_estabelecimento', termo, ok: false, erro: err.message });
    res.status(500).json({ ok: false, erro: err.message });
  }
});

app.get('/licenciados/buscar', async (req, res) => {
  const termo = req.query.q;
  if (!termo) return res.status(400).json({ ok: false, erro: 'Informe "q" na query string.' });
  try {
    const opcoes = await session.withPage((page) => tickets.buscarLicenciados(page, termo));
    audit({ acao: 'buscar_licenciado', termo, ok: true, total: opcoes.length });
    res.json({ ok: true, opcoes });
  } catch (err) {
    audit({ acao: 'buscar_licenciado', termo, ok: false, erro: err.message });
    res.status(500).json({ ok: false, erro: err.message });
  }
});

app.post('/tickets/criar', async (req, res) => {
  const {
    titulo,
    tipo,
    cnpjEstabelecimento,
    cnpjLicenciado = tickets.LICENCIADO_PADRAO_CNPJ,
    fornecedor,
    urlPagina,
    descricao,
    anexos, // array de caminhos de arquivo LOCAIS (mesma maquina) — nao upload multipart
  } = req.body || {};
  if (!titulo || !tipo || !cnpjEstabelecimento || !descricao) {
    return res.status(400).json({
      ok: false,
      erro: 'Informe "titulo", "tipo", "cnpjEstabelecimento" e "descricao".',
    });
  }
  if (anexos && anexos.some((p) => !fs.existsSync(p))) {
    return res.status(400).json({ ok: false, erro: 'Um ou mais caminhos em "anexos" não existem no disco.' });
  }
  try {
    const resultado = await session.withPage((page) =>
      tickets.criar(page, { titulo, tipo, cnpjEstabelecimento, cnpjLicenciado, fornecedor, urlPagina, descricao, anexos })
    );
    audit({ acao: 'criar_ticket', titulo, tipo, cnpjEstabelecimento, totalAnexos: anexos?.length || 0, ...resultado });
    res.json(resultado);
  } catch (err) {
    audit({ acao: 'criar_ticket', titulo, tipo, cnpjEstabelecimento, ok: false, erro: err.message });
    res.status(500).json({ ok: false, erro: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    await session.forceLogin();
    audit({ acao: 'login_forcado', ok: true });
    res.json({ ok: true });
  } catch (err) {
    audit({ acao: 'login_forcado', ok: false, erro: err.message });
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// Usado pela extensao do Chrome (chrome-extension/) pra preencher o login
// no navegador REAL do usuario com um clique. Nao usa o Playwright/sessao
// do robo — so devolve as credenciais salvas no Keychain pra extensao
// preencher a pagina que ja esta aberta.
app.get('/login-helper', async (req, res) => {
  try {
    const { email, password } = await secrets.getCredentials();
    audit({ acao: 'login_helper_credenciais', ok: true });
    res.json({ ok: true, email, password });
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// Endpoint separado (chamado so' na hora de preencher o campo do
// autenticador) pra garantir que o codigo TOTP devolvido esta sempre
// fresco, mesmo se o preenchimento de email/senha demorou alguns segundos.
app.get('/login-helper/totp', async (req, res) => {
  try {
    const { totpSecret } = await secrets.getCredentials();
    const code = authenticator.generate(totpSecret);
    audit({ acao: 'login_helper_totp', ok: true });
    res.json({ ok: true, code });
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[se7en-robot] rodando em http://127.0.0.1:${PORT} (somente localhost)`);
});
