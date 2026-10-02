const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'db.json');

function getAll() {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function save(products) {
  fs.writeFileSync(filePath, `${JSON.stringify(products, null, 2)}\n`);
}

module.exports = { getAll, save };