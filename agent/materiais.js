const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, 'materiais', 'catalogo.json');
const catalogo = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

function listCatalog() {
  return catalogo;
}

function findMaterial(id) {
  return catalogo.find((m) => m.id === id) || null;
}

function readFileBase64(material) {
  const filePath = path.join(__dirname, 'materiais', material.arquivo);
  return fs.readFileSync(filePath).toString('base64');
}

module.exports = { listCatalog, findMaterial, readFileBase64 };
