/**
 * Acoes na aba "Tickets" do portal, dirigindo a UI real (mesmo motivo de
 * equipamentos.js: o token de auth so' existe decifrado dentro do bundle
 * da aplicacao). Confirmado lendo o bundle que o payload real e':
 *
 *   POST tickets/create
 *   { title, user_id, seller_id, la_id, type, acquire_name,
 *     url_page_error, first_message, attachments }
 *
 * seller_id e la_id sao os MESMOS ids usados em equipamentos.js
 * (datasets seller/list/ec e seller/list/la) — por isso resolvemos
 * Estabelecimento/Licenciado do mesmo jeito: digitando no combobox e
 * lendo as opcoes que aparecem.
 */
const { BASE_URL } = require('../browser/session');

const NAV_TIMEOUT = 60000;

// As 61 opcoes fixas de "Tipo de solicitacao", exatamente como aparecem
// no dropdown — a API espera a string completa e exata.
const TIPOS_SOLICITACAO = [
  'ATENDIMENTO PARA GESTORES - DÚVIDAS / SUSGESTÕES / RECLAMAÇÕES',
  'BACKOFFICE - CADASTRAL - ALTERAÇÃO CADASTRAL',
  'BACKOFFICE - CADASTRAL - GESTÃO DE PRODUTOS FINANCEIROS',
  'BACKOFFICE - CADASTRAL - MIGRAÇÃO DE WL',
  'BACKOFFICE - CONTA DIGITAL - ERRO NO PAGAMENTO DE TITULOS',
  'BACKOFFICE - CONTA DIGITAL - ESTORNO PIX / BOLETO',
  'BACKOFFICE - CONTA DIGITAL - GESTÃO DE USUÁRIOS',
  'BACKOFFICE - POS - CONFIGURAÇÃO DE SKIN/ LOGO',
  'BACKOFFICE - POS - ERRO AO TRANSACIONAR',
  'BACKOFFICE - POS - PROBLEMA COM ASSOCIAÇÃO OU DESASSOCIAÇÃO',
  'BACKOFFICE - POS - TAXA AO PORTADOR',
  'BACKOFFICE - SPLIT - PROBLEMAS CADASTRAIS (BENEFICIÁRIO/PIX/BOLETO/ACÚMULO DE RECEBÍVEIS)',
  'BACKOFFICE - SPLIT - PROBLEMAS DE PAGAMENTOS (RECUSAS / DEVOLUÇÕES / LIQUIDAÇÃO NA PRÓPRIA CONTA)',
  'BACKOFFICE - COMISSÃO - DIFERENÇA ENTRE TPV E COMISSÃO',
  'BACKOFFICE - TRANSAÇÃO - ANTECIPAÇÃO AVULSA',
  'BACKOFFICE - TRANSAÇÃO - CANCELAMENTO DE TRANSAÇÃO',
  'BACKOFFICE - TRANSAÇÃO - DIVERGÊNCIA DE PAGAMENTO',
  'BACKOFFICE - TRANSAÇÃO - EC NÃO LIQUIDADO',
  'BACKOFFICE - TRANSAÇÃO - GESTÃO DE PRODUTOS FINANCEIROS',
  'BACKOFFICE/RISCO - CADASTRAL - DESCREDENCIAMENTO',
  'BACKOFFICE/RISCO - CADASTRAL - NOTIFICAÇÃO',
  'BACKOFFICE/RISCO - CONTA DIGITAL - DEVOLUÇÃO DE LIQUIDAÇÃO',
  'BACKOFFICE - COMISSÃO - EC NÃO ESTÁ GERANDO COMISSÃO',
  'BACKOFFICE/RISCO - TRANSAÇÃO - BLOQUEIO DE TRANSAÇÃO',
  'BACKOFFICE/RISCO - TRANSAÇÃO - CHARGEBACK / MED',
  'COMERCIAL - CADASTRAL - CRIAÇÃO / ALTERAÇÃO DE PLANOS',
  'COMERCIAL - CADASTRAL - MIGRAÇÃO DE EC OU CARTEIRA ENTRE PROJETOS WHITE LABEL',
  'COMERCIAL - CADASTRAL - PROBLEMAS NO CREDENCIAMENTO',
  'COMERCIAL - PRODUTOS - SOLICITAÇÃO DE Nº LÓGICO TEF',
  'COMERCIAL - TARIFAS - AJUSTE / LANÇAMENTO DE TARIFAS',
  'COMERCIAL > POS > MIGRAÇÃO POS',
  'FINANCEIRO - CADASTRAL - ALTERAÇÃO DE CHAVE PIX',
  'FINANCEIRO - COMISSÃO - PAGAMENTOS DE COMISSÕES PENDENTES',
  'FINANCEIRO - COMISSÃO - SOLICITAÇÃO DE COMISSÕES RETROATIVAS',
  'FINANCEIRO - COMISSÃO - SOLICITAÇÃO DE PAGAMENTOS DE COMISSÕES',
  'FINANCEIRO - TARIFAS - COBRANÇAS DE TARIFAS INDEVIDAS',
  'LOGÍSTICA - CADASTRAL - SOLICITAÇÃO DE INCLUSÃO/TRANSFERENCIA DE INVENTÁRIO',
  'LOGÍSTICA - MANUTENÇÇÃO - MANUTENÇÃO DE POS',
  'LOGÍSTICA - SUPRIMENTOS - SOLICITAÇÃO DE SUPRIMENTOS (CHIPS) E PERIFÉRICOS (ACESSÓRIOS)',
  'ONBOARDING - CADASTRAL - ALTERAÇÃO DE CNPJ DO LICENCIADO/WHITE LABEL',
  'ONBOARDING - CADASTRAL - ALTERAÇÃO CADASTRAL',
  'ONBOARDING - CADASTRAL - CRIAÇÃO DE USUÁRIOS NO PORTAL (ACESSO SECUNDÁRIO)',
  'ONBOARDING - JURÍDICO - DISTRATO DE LICENCIADO/WHITE LABEL',
  'TECNOLOGIA - APLICATIVO - PROBLEMA NA UTILIZAÇÃO DO APLICATIVO',
  'TECNOLOGIA - APLICATIVO - TROCA DE DISPOSITIVO',
  'TECNOLOGIA - CADASTRAL - ALTERAÇÃO DE DOMICILIO BANCÁRIO F5',
  'TECNOLOGIA - CADASTRAL - ALTERAÇÃO DE DOMICILIO BANCÁRIO F6',
  'TECNOLOGIA - TRANSAÇÃO - PROBLEMA SINCRONIZAÇÃO DE VENDA',
  'TECNOLOGIA - CADASTRAL - PROBLEMA AO ATUALIZAR OS DADOS',
  'TECNOLOGIA - CADASTRAL - PROBLEMA AO CADASTRAR',
  'TECNOLOGIA - TRANSAÇÃO - PROBLEMA COM TRANSAÇÃO',
  'TECNOLOGIA - TRANSAÇÃO - PROBLEMA AO REALIZAR CASH-OUT',
  'TECNOLOGIA - WEB - ERRO AO TENTAR REALIZAR UMA AÇÃO',
  'TECNOLOGIA - INTEGRAÇÃO - SOLICITAÇÃO DE TOKEN DE INTEGRAÇÃO',
  'WEQI - POS - PROBLEMA COM ASSOCIAÇÃO E DESASSOCIAÇÃO',
  'WEQI - TRANSAÇÃO - PROBLEMA NO PIX',
  'WEQI - TRANSAÇÃO - JUROS AO PORTADOR',
  'WEQI - TRANSAÇÃO - PROBLEMA COM DÉBITO / CRÉDITO',
  'WEQI - SOFTWARE - MÁQUINA NÃO INICIALIZA OU COM MAINAPP',
  'WEQI - SOFTWARE - BAIXO DESEMPENHO DA APLICAÇÃO',
  'WEQI - SOFTWARE - ATUALIZAÇÃO DA SKIN',
  'WEQI - CHIP - PROBLEMA COM DADOS MÓVEIS',
];

const FORNECEDORES = ['F3', 'F4', 'F5', 'F6', 'F7'];

// Licenciado padrao: pedido explicito do usuario pra sempre usar "SE7EN"
// (a propria conta), nunca perguntar isso no fluxo de WhatsApp.
const LICENCIADO_PADRAO_CNPJ = '000000000000000';

function onlyDigits(str) {
  return String(str || '').replace(/\D/g, '');
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function abrirFormulario(page) {
  await page.goto(`${BASE_URL}/tickets-add`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="titulo"]').waitFor({ timeout: NAV_TIMEOUT });
}

// indice dos comboboxes no formulario, na ordem visual:
// 0 = Tipo de solicitacao, 1 = Estabelecimento, 2 = Licenciado, 3 = Fornecedor
const COMBO = { TIPO: 0, ESTABELECIMENTO: 1, LICENCIADO: 2, FORNECEDOR: 3 };

async function listarOpcoesCombobox(page, indice, termoBusca) {
  const combo = page.locator('input[role="combobox"]').nth(indice);
  await combo.click({ timeout: 10000 });
  if (termoBusca) {
    await combo.fill(termoBusca);
    await page.waitForTimeout(1200);
  } else {
    await page.waitForTimeout(800);
  }
  const opcoes = await page.getByRole('option').allInnerTexts().catch(() => []);
  return opcoes;
}

async function selecionarOpcaoCombobox(page, indice, termoBusca, matchRegex) {
  const opcoes = await listarOpcoesCombobox(page, indice, termoBusca);
  const opcao = page.getByRole('option', { name: matchRegex }).first();
  if (!(await opcao.count())) {
    await page.keyboard.press('Escape').catch(() => {});
    return { ok: false, opcoesEncontradas: opcoes };
  }
  await opcao.click();
  return { ok: true };
}

/**
 * Busca estabelecimentos por nome ou CNPJ (sem selecionar nada) — usado
 * pelo fluxo conversacional pra desambiguar antes de criar o ticket.
 */
async function buscarEstabelecimentos(page, termo) {
  await abrirFormulario(page);
  const opcoes = await listarOpcoesCombobox(page, COMBO.ESTABELECIMENTO, termo);
  await page.keyboard.press('Escape').catch(() => {});
  return opcoes.map((texto) => {
    const idx = texto.lastIndexOf(' - ');
    return idx === -1
      ? { texto, nome: texto, cnpj: null }
      : { texto, nome: texto.slice(0, idx), cnpj: onlyDigits(texto.slice(idx + 3)) };
  });
}

/**
 * Busca licenciados por nome ou CNPJ (mesma logica).
 */
async function buscarLicenciados(page, termo) {
  await abrirFormulario(page);
  const opcoes = await listarOpcoesCombobox(page, COMBO.LICENCIADO, termo);
  await page.keyboard.press('Escape').catch(() => {});
  return opcoes.map((texto) => {
    const idx = texto.lastIndexOf(' - ');
    return idx === -1
      ? { texto, nome: texto, cnpj: null }
      : { texto, nome: texto.slice(0, idx), cnpj: onlyDigits(texto.slice(idx + 3)) };
  });
}

/**
 * Cria um ticket. `tipo` precisa ser uma das strings exatas de
 * TIPOS_SOLICITACAO. Confirmado testando ao vivo: Titulo, Tipo,
 * Estabelecimento, Licenciado e Descricao sao TODOS obrigatorios (o
 * botao "Criar ticket" so' habilita com os 5 preenchidos) — `fornecedor`
 * e `urlPagina` sao opcionais.
 */
async function criar(page, { titulo, tipo, cnpjEstabelecimento, cnpjLicenciado, fornecedor, urlPagina, descricao, anexos }) {
  if (!TIPOS_SOLICITACAO.includes(tipo)) {
    return { ok: false, motivo: 'tipo_invalido', detalhe: { tipoRecebido: tipo } };
  }
  if (!cnpjLicenciado) {
    return { ok: false, motivo: 'licenciado_obrigatorio' };
  }

  await abrirFormulario(page);

  await page.locator('input[name="titulo"]').fill(titulo);

  const tipoSel = await selecionarOpcaoCombobox(page, COMBO.TIPO, tipo, new RegExp('^' + escapeRegExp(tipo) + '$'));
  if (!tipoSel.ok) return { ok: false, motivo: 'tipo_nao_encontrado_no_dropdown' };

  const estabSel = await selecionarOpcaoCombobox(
    page,
    COMBO.ESTABELECIMENTO,
    onlyDigits(cnpjEstabelecimento),
    new RegExp(escapeRegExp(onlyDigits(cnpjEstabelecimento)))
  );
  if (!estabSel.ok) {
    return { ok: false, motivo: 'estabelecimento_nao_encontrado', detalhe: { cnpjBuscado: cnpjEstabelecimento } };
  }

  const licSel = await selecionarOpcaoCombobox(
    page,
    COMBO.LICENCIADO,
    onlyDigits(cnpjLicenciado),
    new RegExp(escapeRegExp(onlyDigits(cnpjLicenciado)))
  );
  if (!licSel.ok) {
    return { ok: false, motivo: 'licenciado_nao_encontrado', detalhe: { cnpjBuscado: cnpjLicenciado } };
  }

  if (fornecedor) {
    if (!FORNECEDORES.includes(fornecedor)) {
      return { ok: false, motivo: 'fornecedor_invalido', detalhe: { fornecedorRecebido: fornecedor } };
    }
    const fornSel = await selecionarOpcaoCombobox(page, COMBO.FORNECEDOR, null, new RegExp('^' + fornecedor + '$'));
    if (!fornSel.ok) return { ok: false, motivo: 'fornecedor_nao_encontrado_no_dropdown' };
  }

  if (urlPagina) {
    await page.locator('input[name="link_problema"]').fill(urlPagina);
  }

  await page.locator('textarea').first().fill(descricao);

  if (anexos && anexos.length) {
    // Confirmado ao vivo: o input aceita multiplos arquivos e nao faz
    // upload separado — fica em memoria (base64) ate' o submit.
    await page.locator('input[type="file"]').setInputFiles(anexos);
    await page.waitForTimeout(1000);
  }

  await page.waitForTimeout(500);

  const botao = page.getByRole('button', { name: /^criar ticket$/i }).last();
  const desabilitado = await botao.isDisabled();
  if (desabilitado) {
    return { ok: false, motivo: 'formulario_incompleto', detalhe: 'Botão "Criar ticket" continua desabilitado após preencher os campos.' };
  }

  await botao.click();
  await page.waitForTimeout(3000);

  // Apos criar, o portal costuma redirecionar pra lista ou pro detalhe;
  // tenta capturar o numero do ticket se aparecer na tela/URL.
  const resultado = await page.evaluate(() => ({
    url: location.pathname,
    texto: document.body.innerText.slice(0, 600),
  }));

  return { ok: true, resultado };
}

module.exports = {
  TIPOS_SOLICITACAO,
  FORNECEDORES,
  LICENCIADO_PADRAO_CNPJ,
  buscarEstabelecimentos,
  buscarLicenciados,
  criar,
};
