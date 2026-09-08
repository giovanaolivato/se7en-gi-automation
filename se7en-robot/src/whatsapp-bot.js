/**
 * Bot de WhatsApp dedicado a acoes de equipamento (vincular/desvincular
 * POS a estabelecimento), independente do bot "Gi" (openwa-automations/
 * agent). Usa a MESMA sessao/numero WAHA da Gi, mas escuta num segundo
 * webhook proprio — nao toca no processo nem no codigo da Gi.
 *
 * So responde no self-chat (mensagens que voce manda pra voce mesmo no
 * WhatsApp), igual ao autoteste que a Gi ja usa. Toda acao que muda
 * estado (associar/desassociar) pede confirmacao explicita antes de
 * executar.
 */
const express = require('express');
const waha = require('./whatsapp/waha');
const robot = require('./whatsapp/robotClient');
const nlu = require('./whatsapp/nlu');
const { extrairIntencao, ehConfirmacaoPositiva, ehConfirmacaoNegativa } = nlu;
const pendingConfirmations = require('./whatsapp/pendingConfirmations');
const ticketFlow = require('./whatsapp/ticketFlow');
const mediaDownload = require('./whatsapp/mediaDownload');

const PORT = process.env.WHATSAPP_PORT || 3003;

// A Gi (openwa-automations/agent) escuta o mesmo self-chat pra perguntas
// gerais. Sem esse filtro, os dois bots processam a mesma mensagem e
// respondem em dobro — então só engata em mensagem que parece comando de
// equipamento.
const EQUIPMENT_COMMAND_REGEX = /\b(vincul\w*|desvincul\w*|associ\w*|desassoci\w*)\b|\b(sn|s[ée]rie)\s+[a-z0-9]{4,}\b/i;

let ownChatId = null;
let ownLid = null;

function formatarEstabelecimento(detalhe) {
  if (!detalhe) return '';
  if (!detalhe.vinculado) return 'sem estabelecimento vinculado';
  return `${detalhe.estabelecimento} (${detalhe.documentoEc})`;
}

function formatarBusca(detalhe) {
  return (
    `📟 *${detalhe.posTitulo}*\n` +
    `Modelo: ${detalhe.modelo}\n` +
    `Fornecedor: ${detalhe.fornecedor}\n` +
    `Proprietário: ${detalhe.proprietario || '—'}\n` +
    `Estabelecimento: ${formatarEstabelecimento(detalhe)}`
  );
}

const AVISO_F8 = '\n\n⚠️ Lembre de reiniciar a maquininha (tecla F8) pra finalizar.';

async function tratarConfirmacaoPositiva(chatId, pendente) {
  pendingConfirmations.clear(chatId);
  if (pendente.acao === 'associar') {
    const r = await robot.associar(pendente.serial, pendente.cnpj);
    if (r.ok) {
      await waha.sendText(
        chatId,
        `✅ Máquina ${pendente.serial} vinculada a ${formatarEstabelecimento(r.detalhe)}.${AVISO_F8}`
      );
    } else if (r.motivo === 'ja_vinculado') {
      await waha.sendText(chatId, `Essa máquina já está vinculada a ${formatarEstabelecimento(r.detalhe)}.`);
    } else if (r.motivo === 'estabelecimento_nao_encontrado') {
      await waha.sendText(chatId, `Não encontrei nenhum estabelecimento com o CNPJ ${pendente.cnpj}. Confere o número?`);
    } else {
      await waha.sendText(chatId, `Deu erro tentando vincular: ${r.erro || 'erro desconhecido'}`);
    }
    return;
  }
  if (pendente.acao === 'desassociar') {
    const r = await robot.desassociar(pendente.serial);
    if (r.ok) {
      await waha.sendText(chatId, `✅ Máquina ${pendente.serial} desvinculada.${AVISO_F8}`);
    } else if (r.motivo === 'ja_desvinculado') {
      await waha.sendText(chatId, `Essa máquina já estava sem estabelecimento vinculado.`);
    } else {
      await waha.sendText(chatId, `Deu erro tentando desvincular: ${r.erro || 'erro desconhecido'}`);
    }
  }
}

async function processarPedido(chatId, texto) {
  const intent = await extrairIntencao(texto);

  if (intent.acao === 'buscar') {
    if (!intent.serial) {
      await waha.sendText(chatId, 'Qual o número de série (SN) da máquina que você quer consultar?');
      return;
    }
    const r = await robot.buscar(intent.serial);
    if (r.ok) await waha.sendText(chatId, formatarBusca(r.detalhe));
    else await waha.sendText(chatId, `Não achei o SN ${intent.serial}: ${r.erro || 'erro desconhecido'}`);
    return;
  }

  if (intent.acao === 'associar') {
    if (!intent.serial || !intent.cnpj) {
      const faltando = !intent.serial && !intent.cnpj ? 'o SN da máquina e o CNPJ do estabelecimento' : !intent.serial ? 'o SN da máquina' : 'o CNPJ do estabelecimento';
      await waha.sendText(chatId, `Falta ${faltando} pra eu vincular. Pode mandar?`);
      return;
    }
    pendingConfirmations.set(chatId, 'associar', intent.serial, intent.cnpj);
    await waha.sendText(
      chatId,
      `Confirma: vincular a máquina *${intent.serial}* ao estabelecimento CNPJ *${intent.cnpj}*? (responda "sim" ou "não")`
    );
    return;
  }

  if (intent.acao === 'desassociar') {
    if (!intent.serial) {
      await waha.sendText(chatId, 'Qual o SN da máquina que você quer desvincular?');
      return;
    }
    pendingConfirmations.set(chatId, 'desassociar', intent.serial, null);
    await waha.sendText(chatId, `Confirma: desvincular a máquina *${intent.serial}* do estabelecimento atual? (responda "sim" ou "não")`);
    return;
  }

  await waha.sendText(
    chatId,
    'Cuido de maquininhas (POS) e chamados. Exemplos:\n' +
      '"vincula o SN 6K697975 ao CNPJ 22.576.679/0001-02"\n' +
      '"desvincula o SN 6K697975"\n' +
      '"qual o status do SN 6K697975"\n' +
      '"abrir um chamado"'
  );
}

async function tratarMensagem(chatId, texto) {
  // Conversa de abertura de ticket em andamento tem prioridade — e' um
  // fluxo de varias etapas, entao qualquer mensagem enquanto ativa
  // pertence a ele.
  if (ticketFlow.estaAtiva(chatId)) {
    const r = await ticketFlow.processar(chatId, texto);
    await waha.sendText(chatId, r.texto);
    return;
  }

  const pendente = pendingConfirmations.get(chatId);
  if (pendente) {
    if (ehConfirmacaoPositiva(texto)) {
      await tratarConfirmacaoPositiva(chatId, pendente);
      return;
    }
    if (ehConfirmacaoNegativa(texto)) {
      pendingConfirmations.clear(chatId);
      await waha.sendText(chatId, 'Ok, cancelado.');
      return;
    }
    // Nao foi nem sim nem nao: trata como um pedido novo (substitui a pendencia).
    pendingConfirmations.clear(chatId);
  }

  if (nlu.ehPedidoDeAbrirTicket(texto)) {
    const r = await ticketFlow.iniciar(chatId, texto);
    await waha.sendText(chatId, r.texto);
    return;
  }

  await processarPedido(chatId, texto);
}

const app = express();
app.use(express.json({ limit: '1mb' }));

const MIMETYPES_ANEXO_ACEITOS = /^(image|video)\//;

async function tratarMidia(chatId, media) {
  if (!ticketFlow.estaAtiva(chatId)) {
    await waha.sendText(chatId, 'Recebi seu arquivo, mas não tô no meio de nenhum chamado agora. Pede pra abrir um chamado primeiro.');
    return;
  }
  if (!MIMETYPES_ANEXO_ACEITOS.test(media?.mimetype || '')) {
    await waha.sendText(chatId, 'Só consigo anexar foto ou vídeo por enquanto.');
    return;
  }
  try {
    const { caminho, nomeArquivo } = await mediaDownload.baixarMidia(media.url, media.mimetype);
    const r = ticketFlow.adicionarAnexo(chatId, { caminho, nomeArquivo });
    if (!r.ok) {
      await waha.sendText(chatId, 'Essa conversa de chamado já expirou, o anexo não foi salvo.');
      return;
    }
    await waha.sendText(chatId, `📎 Anexo recebido (${r.total} até agora). Pode mandar mais ou responder "pronto".`);
  } catch (err) {
    console.error('[se7en-whatsapp] Erro baixando anexo:', err);
    await waha.sendText(chatId, 'Não consegui baixar esse arquivo agora. Tenta mandar de novo?');
  }
}

app.post('/webhook', (req, res) => {
  res.sendStatus(200); // ack imediato, processa async

  const evt = req.body;
  if (evt?.event !== 'message' && evt?.event !== 'message.any') return;

  const payload = evt.payload || {};
  const { from, body, source, hasMedia, media } = payload;
  if (source === 'api') return; // nunca reage ao que ela mesma mandou

  const isSelfChat = from === ownChatId || (ownLid && from === ownLid);
  if (!isSelfChat) return; // so' self-chat autorizado, por enquanto

  if (hasMedia) {
    console.log(`[se7en-whatsapp] mídia recebida: ${media?.mimetype}`);
    tratarMidia(from, media).catch((err) => console.error('[se7en-whatsapp] Erro tratando mídia:', err));
    return;
  }
  if (!body) return;

  // Conversa em andamento (ticket ou confirmação pendente) sempre pertence
  // a este bot, senão a mensagem se perde no meio do fluxo. Mensagem nova
  // só engata se parecer comando de equipamento ou pedido de chamado —
  // caso contrário é assunto da Gi.
  const conversaEmAndamento = ticketFlow.estaAtiva(from) || Boolean(pendingConfirmations.get(from));
  if (!conversaEmAndamento && !EQUIPMENT_COMMAND_REGEX.test(body) && !nlu.ehPedidoDeAbrirTicket(body)) return;

  console.log(`[se7en-whatsapp] recebido: "${body}"`);
  tratarMensagem(from, body).catch((err) => {
    console.error('[se7en-whatsapp] Erro processando mensagem:', err);
    waha.sendText(from, 'Isso está levando mais tempo que o normal — assim que eu tiver a resposta te mando. 🙏').catch(() => {});
  });
});

app.get('/health', (req, res) => res.json({ ok: true, ownChatId }));

waha
  .loadOwnNumber()
  .then(({ ownChatId: id, ownLid: lid }) => {
    ownChatId = id;
    ownLid = lid;
    console.log(`[se7en-whatsapp] self-chat autorizado: ${ownChatId} (lid: ${ownLid})`);
    app.listen(PORT, () => console.log(`[se7en-whatsapp] rodando na porta ${PORT}`));
  })
  .catch((err) => {
    console.error('[se7en-whatsapp] Falha ao iniciar:', err.message);
    process.exit(1);
  });
