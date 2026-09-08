const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'knowledge');

function readTopic(relPath) {
  const resolved = path.resolve(ROOT, relPath);
  if (!resolved.startsWith(ROOT + path.sep) && resolved !== ROOT) {
    throw new Error('Caminho fora da base de conhecimento');
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    throw new Error(`Arquivo não encontrado: ${relPath}`);
  }
  return fs.readFileSync(resolved, 'utf8');
}

function readIndex() {
  return readTopic('INDEX.md');
}

module.exports = { readTopic, readIndex };
