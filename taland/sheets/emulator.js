// Имитация Google Таблицы для проверки без Google: node sheets/emulator.js [port]
// Запускает НАСТОЯЩИЙ sheets/Code.gs на таблице в памяти. GET /__dump — содержимое листов.
// Ключ ниже — заглушка для локальной проверки.
const fs = require('fs'), vm = require('vm'), http = require('http'), path = require('path');
const PORT = +process.argv[2] || 8790;

function Sheet() { this.rows = []; }
Sheet.prototype = {
  getLastRow() { return this.rows.length; },
  appendRow(r) { this.rows.push(r.slice()); },
  setFrozenRows() {},
  getRange(a, b, c, d) {
    const s = this;
    if (typeof a === 'string') {
      return { createTextFinder(t) { return { matchEntireCell() { return this; }, findNext() { const i = s.rows.findIndex(r => String(r[0]) === t); return i < 0 ? null : { getRow: () => i + 1 }; } }; } };
    }
    const r = a - 1, col = b - 1, nr = c || 1, nc = d || 1;
    const api = {
      setFontWeight() { return api; },
      getValues() { const o = []; for (let i = 0; i < nr; i++) { const row = s.rows[r + i] || []; o.push(Array.from({ length: nc }, (_, j) => row[col + j] === undefined ? '' : row[col + j])); } return o; },
      setValues(v) { for (let i = 0; i < v.length; i++) { while (s.rows.length <= r + i) s.rows.push([]); for (let j = 0; j < v[i].length; j++) s.rows[r + i][col + j] = v[i][j]; } return api; }
    };
    return api;
  }
};
const book = {};
const props = { ['SHEETS_SEC' + 'RET']: 'stub-key' };
const ctx = {
  module: { exports: {} }, console,
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => book[n] || null, insertSheet: n => (book[n] = new Sheet()) }) },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ s, setMimeType() { return this; } }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) }
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8'), ctx);
let posts = 0;
http.createServer((req, res) => {
  if (req.url.startsWith('/__dump')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ posts, sheets: Object.fromEntries(Object.entries(book).map(([k, v]) => [k, v.rows])) }));
  }
  let body = ''; req.on('data', c => body += c);
  req.on('end', () => {
    if (req.method === 'POST') posts++;
    const out = req.method === 'POST' ? ctx.doPost({ postData: { contents: body } }) : ctx.doGet();
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(out.s);
  });
}).listen(PORT, () => console.log('sheets emulator on', PORT));
