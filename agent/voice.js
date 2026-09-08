// TTS via ElevenLabs (voz natural, escolhida pela Giovana) + ffmpeg pra
// converter pro formato que o WhatsApp aceita (OGG/Opus). STT continua 100%
// local via whisper.cpp (offline, rápido, sem gastar cota de API nenhuma).
const { execFile } = require('child_process');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// Sarah — madura/confiante. Troque aqui se escolher outra voz do catálogo.
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
const WHISPER_MODEL = path.join(__dirname, 'models', 'ggml-small.bin');

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`${cmd} falhou: ${stderr || err.message}`));
      resolve(stdout);
    });
  });
}

async function tmpPath(ext) {
  return path.join(os.tmpdir(), `gi-voice-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
}

// Texto -> voice note (opus/ogg em base64), pronto pro campo `file.data` do WAHA.
async function synthesize(text) {
  const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
    method: 'POST',
    headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!resp.ok) throw new Error(`ElevenLabs falhou: ${resp.status} ${await resp.text()}`);
  const mp3 = Buffer.from(await resp.arrayBuffer());

  const mp3Path = await tmpPath('mp3');
  const opus = await tmpPath('opus');
  try {
    await fs.writeFile(mp3Path, mp3);
    await run('ffmpeg', ['-y', '-i', mp3Path, '-c:a', 'libopus', '-b:a', '32k', '-ar', '48000', '-ac', '1', opus]);
    const data = await fs.readFile(opus);
    return {
      mimetype: 'audio/ogg; codecs=opus',
      filename: 'voice.ogg',
      data: data.toString('base64'),
    };
  } finally {
    await fs.unlink(mp3Path).catch(() => {});
    await fs.unlink(opus).catch(() => {});
  }
}

// Baixa o áudio recebido (URL do WAHA) e transcreve com whisper.cpp local.
async function transcribeFromUrl(mediaUrl, apiKey) {
  const resp = await fetch(mediaUrl, { headers: { 'X-Api-Key': apiKey } });
  if (!resp.ok) throw new Error(`Falha ao baixar áudio: ${resp.status}`);
  const buf = Buffer.from(await resp.arrayBuffer());

  const input = await tmpPath('bin');
  const wav = await tmpPath('wav');
  try {
    await fs.writeFile(input, buf);
    await run('ffmpeg', ['-y', '-i', input, '-ar', '16000', '-ac', '1', wav]);
    const out = await run('whisper-cli', ['-m', WHISPER_MODEL, '-f', wav, '-l', 'pt', '-nt', '-np']);
    return out.trim();
  } finally {
    await fs.unlink(input).catch(() => {});
    await fs.unlink(wav).catch(() => {});
  }
}

module.exports = { synthesize, transcribeFromUrl };
