const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '..', 'data', '.cache');

function ensureDir() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function has(key) {
  return fs.existsSync(path.join(CACHE_DIR, `${key}.json`));
}

function read(key) {
  return JSON.parse(fs.readFileSync(path.join(CACHE_DIR, `${key}.json`), 'utf8'));
}

function write(key, data) {
  ensureDir();
  fs.writeFileSync(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(data, null, 2));
}

module.exports = { has, read, write };
