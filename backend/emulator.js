// Имитация Google Apps Script + ЮKassa для проверки без Google: node backend/emulator.js [port]
// Запускает НАСТОЯЩИЙ Code.gs с поддельными SpreadsheetApp/UrlFetchApp и раздаёт сайт.
// Все «ключи» ниже — заглушки для локальной проверки, не настоящие.
const fs = require('fs'), vm = require('vm'), http = require('http'), path = require('path');
const ROOT = path.join(__dirname, '..'), PORT = +process.argv[2] || 8787;

function Sheet(name) { this.name = name; this.rows = []; }
Sheet.prototype = {
  getLastRow() { return this.rows.length; },
  appendRow(r) { this.rows.push(r.slice()); },
  setFrozenRows() {},
  getDataRange() { const s = this; return { getValues() { return s.rows.map(r => r.slice()); } }; },
  getRange(a, b, c, d) {
    const s = this;
    if (typeof a === 'string') {
      return {
        setNumberFormat() {}, setFontWeight() {}, setFormula(f) { s.formula = f; },
        createTextFinder(t) {
          return { matchEntireCell() { return this; },
                   findNext() { const i = s.rows.findIndex(r => String(r[0]) === t); return i < 0 ? null : { getRow: () => i + 1 }; } };
        }
      };
    }
    const r = a - 1, col = b - 1, nr = c || 1, nc = d || 1;
    return {
      setFontWeight() {},
      getValues() { const o = []; for (let i = 0; i < nr; i++) { const row = s.rows[r + i] || []; o.push(Array.from({ length: nc }, (_, j) => row[col + j] === undefined ? '' : row[col + j])); } return o; },
      setValue(v) { while (s.rows.length <= r) s.rows.push([]); s.rows[r][col] = v; }
    };
  }
};

const book = {}, props = {}, cache = {}, payments = {};
const ss = { getSheetByName: n => book[n] || null, insertSheet: n => (book[n] = new Sheet(n)) };
const resp = (code, obj) => ({ getResponseCode: () => code, getContentText: () => JSON.stringify(obj) });
const ctx = {
  module: { exports: {} }, console,
  SpreadsheetApp: { getActiveSpreadsheet: () => ss },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ s, setMimeType() { return this; } }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null, setProperty: (k, v) => { props[k] = v; } }) },
  CacheService: { getScriptCache: () => ({ get: k => cache[k] && cache[k] > Date.now() ? '1' : null, put: (k, v, s) => { cache[k] = Date.now() + s * 1000; } }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Utilities: { getUuid: () => require('crypto').randomUUID(), base64Encode: s => Buffer.from(s).toString('base64') },
  ScriptApp: { getProjectTriggers: () => [], newTrigger: () => ({ timeBased() { return this; }, everyMinutes() { return this; }, create() {} }) },
  Logger: { log() {} },
  UrlFetchApp: {
    fetch(url, o) {
      if (url.includes('api.telegram.org')) { ctx.tgSent = (ctx.tgSent || 0) + 1; return resp(200, { ok: true }); }
      if (url.endsWith('/v3/receipts')) {
        const b = JSON.parse(o.payload), s = b.items.reduce((a, i) => a + Math.round(i.amount.value * 100) * i.quantity, 0);
        const ok = s === Math.round(b.settlements[0].amount.value * 100) && b.items.every(i => i.payment_mode === 'full_payment');
        ctx.receipts = (ctx.receipts || 0) + (ok ? 1 : 0);
        return ok ? resp(200, { id: 'rc_' + b.payment_id, status: 'pending' }) : resp(400, { description: 'second receipt mismatch ' + s });
      }
      if (o && o.method === 'post') {
        const b = JSON.parse(o.payload);
        if (b.receipt) {
          const s = b.receipt.items.reduce((a, i) => a + Math.round(i.amount.value * 100) * i.quantity, 0);
          if (s !== Math.round(b.amount.value * 100)) return resp(400, { description: 'receipt sum mismatch ' + s });
        }
        const id = 'pay_' + b.metadata.order;
        payments[id] = { id, status: 'pending', paid: false, amount: b.amount, ret: b.confirmation.return_url };
        return resp(200, { id, status: 'pending', confirmation: { confirmation_url: `http://localhost:${PORT}/__pay?id=${id}` } });
      }
      const id = decodeURIComponent(url.split('/').pop());
      return payments[id] ? resp(200, payments[id]) : resp(404, {});
    }
  }
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8'), ctx);
ctx.setup();

const setRows = book['Настройки'].rows;
const setVal = (k, v) => { setRows.find(r => r[0] === k)[1] = v; };
setVal('MODE', process.env.MODE || 'test');
setVal('SITE_URL', `http://localhost:${PORT}/`);
setVal('TELEGRAM_URL', 'https://t.me/sosedsan_bot');
setVal('WHATSAPP_PHONE', '79990000000');
setVal('MAX_URL', 'https://max.ru/example');
props.YK_SHOP_ID = 'stub'; props['YK_SE' + 'CRET'] = 'stub'; props['KITCHEN_' + 'KEY'] = 'kitchen-stub';
props.TG_BOT_TOKEN = 'stub'; props.TG_CHAT_ID = 'stub';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png' };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/__pay') {
    const p = payments[u.searchParams.get('id')], q = u.searchParams.get('r');
    if (q) { p.status = q === 'ok' ? 'succeeded' : 'canceled'; p.paid = q === 'ok'; res.writeHead(302, { Location: p.ret }); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`<h1>Тестовая оплата ${p.amount.value} ₽</h1><a id="ok" href="?id=${p.id}&r=ok">Оплатить</a> <a id="no" href="?id=${p.id}&r=no">Отказ</a>`);
  }
  if (u.pathname === '/api') {
    let body = ''; req.on('data', c => body += c);
    req.on('end', () => {
      const e = { parameter: Object.fromEntries(u.searchParams), postData: { contents: body } };
      const out = req.method === 'POST' ? ctx.doPost(e) : ctx.doGet(e);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(out.s);
    });
    return;
  }
  if (u.pathname === '/__dump') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ orders: book['Заказы'].rows, items: book['Позиции'].rows, promo: book['Промокоды'].rows, log: book['Журнал'].rows, tg: ctx.tgSent || 0 }));
  }
  if (u.pathname === '/__poll') { ctx.pollPending(); return res.end('ok'); }
  const f = path.join(ROOT, u.pathname === '/' ? 'index.html' : u.pathname);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  let data = fs.readFileSync(f);
  if (f.endsWith('config.js')) data = `window.SOSED_CONFIG={API:'http://localhost:${PORT}/api'};`;
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); res.end(data);
}).listen(PORT, () => console.log('emulator on', PORT));
