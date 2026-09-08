/**
 * Conversa passo a passo pra abrir um ticket no portal, espelhando a
 * ordem natural de quem esta relatando um problema: primeiro descreve o
 * que aconteceu, depois a Gi classifica/confirma os campos tecnicos que
 * o formulario do portal exige.
 *
 * Campos obrigatorios do formulario (confirmados testando ao vivo):
 * Titulo, Tipo de solicitacao, Estabelecimento, Licenciado, Descricao.
 * "Licenciado" e' sempre fixo em SE7EN (pedido explicito do usuario, sem
 * perguntar). Fornecedor (F3-F7) e' obrigatorio por regra de negocio
 * (mesmo o botao do portal habilitando sem ele), entao SEMPRE perguntamos.
 */
const robot = require('./robotClient');
const nlu = require('./nlu');
const mediaDownload = require('./mediaDownload');

const TTL_MS = 15 * 60 * 1000; // conversa mais longa que a de equipamentos

const conversas = new Map(); // chatId -> estado

let tiposCache = null;
async function getTipos() {
  if (tiposCache) return tiposCache;
  const r = await robot.tiposTicket();
  tiposCache = r.ok ? r.tipos : [];
  return tiposCache;
}

function novoEstado() {
  return {
    step: 'descricao',
    data: { descricao: null, tipo: null, estabelecimento: null, fornecedor: null, titulo: null, anexos: [] },
    expiresAt: Date.now() + TTL_MS,
  };
}

function get(chatId) {
  const e = conversas.get(chatId);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    conversas.delete(chatId);
    return null;
  }
  return e;
}

function set(chatId, estado) {
  estado.expiresAt = Date.now() + TTL_MS;
  conversas.set(chatId, estado);
}

function clear(chatId) {
  conversas.delete(chatId);
}

function estaAtiva(chatId) {
  return !!get(chatId);
}

/**
 * Chamado pelo bot quando chega uma midia (foto/video) NUM CHAT com
 * conversa de ticket ativa, seja qual for a etapa atual — a pessoa pode
 * mandar a evidencia a qualquer momento, nao so' quando perguntada.
 * Nao muda a etapa da conversa, so' guarda o anexo.
 */
function adicionarAnexo(chatId, { caminho, nomeArquivo }) {
  const estado = get(chatId);
  if (!estado) return { ok: false };
  estado.data.anexos.push({ caminho, nomeArquivo });
  set(chatId, estado);
  return { ok: true, total: estado.data.anexos.length };
}

const FORNECEDOR_RE = /\bF([3-7])\b/i;

/**
 * Inicia a conversa. Se o usuario ja mandou a descricao do problema na
 * mesma mensagem que pediu pra abrir o ticket, pula direto pra
 * classificacao em vez de perguntar nome desnecessariamente.
 */
async function iniciar(chatId, mensagemInicial) {
  const estado = novoEstado();
  // Heuristica simples: se a mensagem tem mais que so' "abre um chamado",
  // ja' trata o resto como a descricao.
  const semGatilho = mensagemInicial
    .replace(/\b(abrir?|criar?|abre|cria|preciso de)\b.{0,15}\b(chamado|ticket)\b/i, '')
    .replace(/[,.:;-]+/, '')
    .trim();
  if (semGatilho.length > 8) {
    return processarDescricao(chatId, estado, semGatilho);
  }
  set(chatId, estado);
  return { texto: 'Beleza, vamos abrir um chamado. Descreve o problema, por favor.' };
}

async function processarDescricao(chatId, estado, texto) {
  estado.data.descricao = texto;
  const tipos = await getTipos();
  if (!tipos.length) {
    clear(chatId);
    return { texto: 'Não consegui carregar as categorias do portal agora. Tenta de novo em instantes.' };
  }
  const tipoSugerido = await nlu.classificarTipoTicket(texto, tipos);
  if (!tipoSugerido) {
    clear(chatId);
    return { texto: 'Não consegui classificar o problema agora. Tenta descrever de novo?' };
  }
  estado.data.tipoSugerido = tipoSugerido;
  estado.step = 'confirmar_tipo';
  set(chatId, estado);
  return {
    texto: `Isso se encaixa em: *${tipoSugerido}*\nConfirma? (sim / não, me diga a categoria certa)`,
  };
}

async function processarConfirmarTipo(chatId, estado, texto) {
  if (nlu.ehConfirmacaoPositiva(texto)) {
    estado.data.tipo = estado.data.tipoSugerido;
    estado.step = 'estabelecimento';
    set(chatId, estado);
    return { texto: 'Qual o estabelecimento (nome ou CNPJ)?' };
  }
  if (nlu.ehConfirmacaoNegativa(texto)) {
    clear(chatId);
    return { texto: 'Ok, cancelado. Quando quiser, é só pedir pra abrir o chamado de novo.' };
  }
  // Usuario descreveu a categoria certa em texto livre — reclassifica.
  const tipos = await getTipos();
  const tipoSugerido = await nlu.classificarTipoTicket(texto, tipos);
  if (!tipoSugerido) {
    return { texto: 'Não entendi. Confirma a categoria sugerida com "sim", ou descreve melhor qual seria.' };
  }
  estado.data.tipoSugerido = tipoSugerido;
  set(chatId, estado);
  return { texto: `Entendi diferente agora: *${tipoSugerido}*\nConfirma? (sim / não)` };
}

async function processarEstabelecimento(chatId, estado, texto) {
  const r = await robot.buscarEstabelecimentos(texto);
  if (!r.ok || !r.opcoes?.length) {
    return { texto: 'Não achei nenhum estabelecimento com esse nome/CNPJ. Tenta de novo?' };
  }
  if (r.opcoes.length === 1) {
    estado.data.estabelecimento = r.opcoes[0];
    estado.step = 'fornecedor';
    set(chatId, estado);
    return { texto: `Estabelecimento: *${r.opcoes[0].texto}*. Qual o fornecedor da maquininha (F3, F4, F5, F6 ou F7)?` };
  }
  const top = r.opcoes.slice(0, 8);
  estado.data.opcoesEstabelecimento = top;
  estado.step = 'escolher_estabelecimento';
  set(chatId, estado);
  const lista = top.map((o, i) => `${i + 1}. ${o.texto}`).join('\n');
  return { texto: `Achei mais de um. Qual desses? Responde com o número:\n${lista}` };
}

async function processarEscolherEstabelecimento(chatId, estado, texto) {
  const n = parseInt(texto.trim(), 10);
  const opcoes = estado.data.opcoesEstabelecimento || [];
  if (!n || n < 1 || n > opcoes.length) {
    return { texto: `Responde só com o número da lista (1 a ${opcoes.length}).` };
  }
  estado.data.estabelecimento = opcoes[n - 1];
  estado.step = 'fornecedor';
  set(chatId, estado);
  return { texto: `Estabelecimento: *${opcoes[n - 1].texto}*. Qual o fornecedor da maquininha (F3, F4, F5, F6 ou F7)?` };
}

async function processarFornecedor(chatId, estado, texto) {
  const m = texto.match(FORNECEDOR_RE);
  if (!m) {
    return { texto: 'Não reconheci. Qual desses: F3, F4, F5, F6 ou F7?' };
  }
  estado.data.fornecedor = `F${m[1]}`;
  estado.step = 'anexos';
  set(chatId, estado);
  return {
    texto:
      'Quer anexar foto ou vídeo como evidência? Manda os arquivos aqui mesmo — pode mandar ' +
      'vários, um de cada vez. Quando terminar (ou se não tiver nenhum), responde "pronto".',
  };
}

const PRONTO_RE = /\b(pronto|acabou|terminei|so' isso|so isso|nao tenho|não tenho|sem anexo)\b/i;

async function processarAnexos(chatId, estado, texto) {
  if (nlu.ehConfirmacaoNegativa(texto) || PRONTO_RE.test(texto)) {
    const tituloSugerido = await nlu.gerarTitulo(estado.data.descricao);
    estado.data.tituloSugerido = tituloSugerido;
    estado.step = 'confirmar_titulo';
    set(chatId, estado);
    return { texto: `Título do chamado: *${tituloSugerido}*\nConfirma? (sim / manda outro título)` };
  }
  const n = estado.data.anexos.length;
  return {
    texto: n
      ? `Já tenho ${n} anexo(s). Manda mais, ou responde "pronto" pra seguir.`
      : 'Manda o arquivo aqui, ou responde "pronto" se não tiver nenhum.',
  };
}

async function processarConfirmarTitulo(chatId, estado, texto) {
  if (nlu.ehConfirmacaoPositiva(texto)) {
    estado.data.titulo = estado.data.tituloSugerido;
  } else if (nlu.ehConfirmacaoNegativa(texto)) {
    clear(chatId);
    await mediaDownload.limpar(estado.data.anexos.map((a) => a.caminho));
    return { texto: 'Ok, cancelado.' };
  } else {
    estado.data.titulo = texto.trim().slice(0, 120);
  }
  estado.step = 'confirmar_final';
  set(chatId, estado);
  const d = estado.data;
  const anexosTexto = d.anexos.length ? `\n*Anexos:* ${d.anexos.length}` : '';
  return {
    texto:
      `Confirma a abertura desse chamado?\n\n` +
      `*Título:* ${d.titulo}\n` +
      `*Tipo:* ${d.tipo}\n` +
      `*Estabelecimento:* ${d.estabelecimento.texto}\n` +
      `*Fornecedor:* ${d.fornecedor}\n` +
      `*Descrição:* ${d.descricao}${anexosTexto}\n\n` +
      `(sim / não)`,
  };
}

async function processarConfirmarFinal(chatId, estado, texto) {
  const d = estado.data;
  if (nlu.ehConfirmacaoNegativa(texto)) {
    clear(chatId);
    await mediaDownload.limpar(d.anexos.map((a) => a.caminho));
    return { texto: 'Ok, cancelado.' };
  }
  if (!nlu.ehConfirmacaoPositiva(texto)) {
    return { texto: 'Responde "sim" pra criar o chamado, ou "não" pra cancelar.' };
  }
  clear(chatId);
  const r = await robot.criarTicket({
    titulo: d.titulo,
    tipo: d.tipo,
    cnpjEstabelecimento: d.estabelecimento.cnpj,
    fornecedor: d.fornecedor,
    descricao: d.descricao,
    anexos: d.anexos.map((a) => a.caminho),
  });
  await mediaDownload.limpar(d.anexos.map((a) => a.caminho));
  if (!r.ok) {
    return { texto: `Deu erro tentando criar o chamado: ${r.erro || r.motivo || 'erro desconhecido'}` };
  }
  return { texto: '✅ Chamado criado com sucesso!' };
}

/**
 * Processa uma mensagem dentro de uma conversa de ticket ja' em
 * andamento. So' chame se `estaAtiva(chatId)` for true.
 */
async function processar(chatId, texto) {
  const estado = get(chatId);
  if (!estado) return { texto: 'Essa conversa de chamado expirou. Pede pra abrir de novo.' };

  switch (estado.step) {
    case 'descricao':
      return processarDescricao(chatId, estado, texto);
    case 'confirmar_tipo':
      return processarConfirmarTipo(chatId, estado, texto);
    case 'estabelecimento':
      return processarEstabelecimento(chatId, estado, texto);
    case 'escolher_estabelecimento':
      return processarEscolherEstabelecimento(chatId, estado, texto);
    case 'fornecedor':
      return processarFornecedor(chatId, estado, texto);
    case 'anexos':
      return processarAnexos(chatId, estado, texto);
    case 'confirmar_titulo':
      return processarConfirmarTitulo(chatId, estado, texto);
    case 'confirmar_final':
      return processarConfirmarFinal(chatId, estado, texto);
    default:
      clear(chatId);
      return { texto: 'Alguma coisa deu errado no fluxo, vamos recomeçar do zero se precisar.' };
  }
}

module.exports = { iniciar, processar, estaAtiva, clear, adicionarAnexo };
