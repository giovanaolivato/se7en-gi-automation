const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const AUDIT_FILE = path.join(LOG_DIR, 'audit.log');

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

/**
 * Loga cada acao que mexe em equipamentos/estabelecimentos: quem pediu
 * (se disponivel), o que foi pedido, e o resultado. Nunca loga senha,
 * TOTP ou qualquer token de sessao.
 */
function audit(entry) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry });
  fs.appendFile(AUDIT_FILE, line + '\n', (err) => {
    if (err) console.error('[logger] falha ao gravar audit log:', err.message);
  });
  console.log('[audit]', line);
}

module.exports = { audit };
