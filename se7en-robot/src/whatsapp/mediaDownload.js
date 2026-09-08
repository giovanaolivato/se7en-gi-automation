/**
 * Baixa midia recebida no WhatsApp (foto/video) pra um arquivo temporario
 * local — mesmo padrao que o bot "Gi" ja usa pra audio (agent/voice.js):
 * a URL do WAHA exige o header X-Api-Key pra baixar o arquivo de verdade.
 */
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const WAHA_API_KEY = process.env.WAHA_API_KEY;

function extensaoPorMimetype(mimetype) {
  const mapa = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/3gpp': '3gp',
    'video/quicktime': 'mov',
  };
  return mapa[mimetype] || 'bin';
}

/**
 * Baixa o arquivo e devolve o caminho local. Quem chama e' responsavel
 * por apagar depois (fs.unlink) quando nao precisar mais.
 */
async function baixarMidia(mediaUrl, mimetype) {
  const resp = await fetch(mediaUrl, { headers: { 'X-Api-Key': WAHA_API_KEY } });
  if (!resp.ok) throw new Error(`Falha ao baixar mídia: ${resp.status}`);
  const buf = Buffer.from(await resp.arrayBuffer());

  const ext = extensaoPorMimetype(mimetype);
  const nomeArquivo = `se7en-anexo-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const caminho = path.join(os.tmpdir(), nomeArquivo);
  await fs.writeFile(caminho, buf);
  return { caminho, nomeArquivo, mimetype };
}

async function limpar(caminhos) {
  await Promise.all((caminhos || []).map((c) => fs.unlink(c).catch(() => {})));
}

module.exports = { baixarMidia, limpar };
