/**
 * Сосед-сан — сервер заказов на Google Apps Script.
 *
 * Сайт → этот скрипт → Google Таблица (Меню, Зоны, Промокоды, Заказы, Позиции, Кухня, Журнал).
 * Цены, минимальный заказ, промокоды и итог считает ТОЛЬКО сервер — цифрам из браузера не верим.
 * Оплата: ЮKassa (redirect), подтверждение — запросом сервера к API ЮKassa, а не по слову браузера.
 *
 * Секреты — только в Свойствах скрипта (Project Settings → Script properties), не в коде и не в таблице:
 *   YK_SHOP_ID, YK_SECRET   — магазин ЮKassa (сначала тестовый)
 *   KITCHEN_KEY             — ключ экрана кухни (длинная случайная строка)
 *   TG_BOT_TOKEN, TG_CHAT_ID — необязательно: уведомление кухне в Telegram
 *
 * Установка — backend/README.md.
 */

var SH = { SET: 'Настройки', MENU: 'Меню', ZONES: 'Зоны', PROMO: 'Промокоды', ORD: 'Заказы',
           ITEMS: 'Позиции', KITCHEN: 'Кухня', LOG: 'Журнал' };

var ST = { WAIT_PAY: 'ОЖИДАЕТ ОПЛАТЫ', CASH_WAIT: 'НАЛИЧНЫЕ: ПОДТВЕРДИТЬ', NEW: 'НОВЫЙ', COOK: 'ГОТОВИТСЯ',
           READY: 'ГОТОВ', COURIER: 'У КУРЬЕРА', DONE: 'ДОСТАВЛЕН', CANCEL: 'ОТМЕНЁН' };
var KITCHEN_ACTIVE = [ST.CASH_WAIT, ST.NEW, ST.COOK, ST.READY, ST.COURIER];
var NEXT = {}; NEXT[ST.NEW] = ST.COOK; NEXT[ST.COOK] = ST.READY; NEXT[ST.READY] = ST.COURIER; NEXT[ST.COURIER] = ST.DONE;
var STAMP = {}; STAMP[ST.COOK] = 'Принят кухней'; STAMP[ST.READY] = 'Готов'; STAMP[ST.COURIER] = 'Передан курьеру'; STAMP[ST.DONE] = 'Доставлен';

var HEAD = {
  'Настройки': ['Параметр', 'Значение', 'Что это'],
  'Меню': ['id', 'Категория', 'Название', 'Цена, ₽', 'Вес, г', 'Объём, мл', 'Шт', 'В наличии', 'Хит', 'Фото', 'Описание', 'Состав'],
  'Зоны': ['id', 'Название', 'Мин. заказ, ₽', 'Доставка, ₽', 'Бесплатно от, ₽', 'Время (текст)', 'Время, мин', 'Ближняя', 'Работает'],
  'Промокоды': ['Код', 'Тип (%/₽)', 'Значение', 'Мин. сумма, ₽', 'Действует до', 'Лимит', 'Использовано', 'Активен', 'Описание', 'Раз на телефон'],
  'Заказы': ['Код', 'Создан', 'Статус', 'Оплата', 'Оплачено', 'ID платежа', 'Имя', 'Телефон', 'Адрес', 'Зона', 'Когда',
             'Комментарий', 'Состав', 'Товары, ₽', 'Скидка, ₽', 'Промокод', 'Доставка, ₽', 'Итого, ₽', 'Источник', 'Срок',
             'Принят кухней', 'Готов', 'Передан курьеру', 'Доставлен', 'Примечание'],
  'Позиции': ['Код заказа', 'Создан', 'id', 'Название', 'Кол-во', 'Цена, ₽', 'Сумма, ₽'],
  'Журнал': ['Время', 'Событие', 'Код', 'Детали']
};

var SETTINGS_DEFAULT = [
  ['MODE', 'demo', 'demo — оплата имитируется (для проверки); test — тестовый магазин ЮKassa; live — боевой'],
  ['SITE_URL', 'https://evdokimovtrade.github.io/sushi/', 'Куда вернуть клиента после оплаты'],
  ['CASH', 'да', 'Принимать оплату курьеру: да/нет. Нужна касса у курьера (54-ФЗ)'],
  ['CASH_AUTO', 'нет', 'да — заказ с оплатой курьеру сразу на кухню; нет — кухня подтверждает после сообщения клиента'],
  ['RECEIPTS', 'да', 'Передавать чек в ЮKassa (Чеки от ЮKassa / АТОЛ): да/нет'],
  ['PAYMENT_MODE', 'full_prepayment', 'Признак расчёта в чеке при оплате на сайте: full_prepayment — предоплата 100% (второй чек «полный расчёт» уйдёт при статусе ДОСТАВЛЕН); full_payment — один чек. Решает бухгалтер'],
  ['VAT_CODE', '1', 'Ставка НДС для чека: 1 — без НДС. Уточнить у бухгалтера'],
  ['UNPAID_CANCEL_MIN', '30', 'Через сколько минут снимать неоплаченный заказ'],
  ['TELEGRAM_URL', '', 'Ссылка на Telegram (бот t.me/имя_bot — код подставится в start)'],
  ['WHATSAPP_PHONE', '', 'Номер WhatsApp только цифрами, 79XXXXXXXXX'],
  ['MAX_URL', '', 'Ссылка на чат или канал в Max'],
  ['OPEN', 'да', 'да — заказы принимаются; нет — сайт покажет «кухня на паузе»']
];

/* ======================= HTTP ======================= */

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.action === 'menu') return out_(publicMenu_());
    if (p.action === 'status') return out_(orderStatus_(p.code));
    if (p.action === 'kitchen') { needKey_(p.key); return out_(kitchenList_()); }
    return out_({ ok: false, error: 'unknown action' });
  } catch (err) { return fail_(err, p.code); }
}

function doPost(e) {
  var b = {};
  try { b = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x) { return out_({ ok: false, error: 'bad json' }); }
  try {
    if (b.action === 'create') return out_(createOrder_(b));
    if (b.action === 'promo') return out_(checkPromo_(b));
    if (b.action === 'setStatus') { needKey_(b.key); return out_(setStatus_(b.code, b.status)); }
    if (b.action === 'confirmCash') { needKey_(b.key); return out_(confirmCash_(b.code, b.accept)); }
    return out_({ ok: false, error: 'unknown action' });
  } catch (err) { return fail_(err, b.code); }
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function fail_(err, code) {
  var msg = String(err && err.message || err);
  if (msg.indexOf('USER:') === 0) return out_({ ok: false, error: msg.slice(5) });
  log_('ОШИБКА', code || '', msg);
  return out_({ ok: false, error: 'Техническая ошибка. Попробуйте ещё раз или напишите нам в мессенджер.' });
}
function userErr_(m) { throw new Error('USER:' + m); }
function needKey_(k) {
  var real = PropertiesService.getScriptProperties().getProperty('KITCHEN_KEY');
  if (!real || k !== real) userErr_('Нет доступа');
}

/* ======================= ТАБЛИЦА ======================= */

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet_(n) { var s = ss_().getSheetByName(n); if (!s) throw new Error('Нет листа ' + n + ' — запустите setup()'); return s; }

function readTable_(name) {
  var v = sheet_(name).getDataRange().getValues(), h = v[0], rows = [];
  for (var i = 1; i < v.length; i++) {
    if (v[i].join('') === '') continue;
    var o = { _row: i + 1 };
    for (var j = 0; j < h.length; j++) o[h[j]] = v[i][j];
    rows.push(o);
  }
  return rows;
}
function col_(name, header) { var i = HEAD[name].indexOf(header); if (i < 0) throw new Error('Нет колонки ' + header); return i + 1; }
function settings_() {
  var o = {};
  readTable_(SH.SET).forEach(function (r) { o[String(r['Параметр']).trim()] = String(r['Значение']).trim(); });
  return o;
}
function yes_(v) { return /^(да|yes|true|1)$/i.test(String(v).trim()); }
function num_(v) { if (v === '' || v === null || v === undefined) return 0; var n = Number(String(v).replace(/\s/g, '').replace(',', '.')); return isNaN(n) ? 0 : n; }
function log_(ev, code, det) {
  try { sheet_(SH.LOG).appendRow([new Date(), ev, code || '', String(det || '').slice(0, 1000)]); } catch (x) {}
}

function loadMenu_() {
  return readTable_(SH.MENU).map(function (r) {
    return { id: String(r['id']).trim(), cat: r['Категория'], name: r['Название'], price: num_(r['Цена, ₽']),
             g: num_(r['Вес, г']) || undefined, ml: num_(r['Объём, мл']) || undefined, pcs: num_(r['Шт']) || undefined,
             available: yes_(r['В наличии']), hit: yes_(r['Хит']), img: r['Фото'], desc: r['Описание'], comp: r['Состав'] };
  }).filter(function (p) { return p.id; });
}
function loadZones_() {
  return readTable_(SH.ZONES).filter(function (r) { return yes_(r['Работает']); }).map(function (r) {
    return { id: String(r['id']).trim(), name: r['Название'], min: num_(r['Мин. заказ, ₽']), fee: num_(r['Доставка, ₽']),
             freeFrom: num_(r['Бесплатно от, ₽']), time: r['Время (текст)'], minutes: num_(r['Время, мин']) || 60, near: yes_(r['Ближняя']) };
  });
}
function loadPromos_() {
  return readTable_(SH.PROMO).map(function (r) {
    return { code: String(r['Код']).trim().toUpperCase(), type: String(r['Тип (%/₽)']).trim(), value: num_(r['Значение']),
             min: num_(r['Мин. сумма, ₽']), until: r['Действует до'] instanceof Date ? r['Действует до'] : null,
             limit: num_(r['Лимит']), used: num_(r['Использовано']), active: yes_(r['Активен']), label: r['Описание'],
             perPhone: yes_(r['Раз на телефон']), _row: r._row };
  });
}

function publicMenu_() {
  var s = settings_();
  return { ok: true, open: yes_(s.OPEN), cash: yes_(s.CASH), mode: s.MODE,
           menu: loadMenu_(), zones: loadZones_(),
           messengers: { telegram: s.TELEGRAM_URL || '', whatsapp: s.WHATSAPP_PHONE || '', max: s.MAX_URL || '' } };
}

/* ======================= РАСЧЁТ (чистые функции) ======================= */

/** Считает заказ по данным сервера. Возвращает {ok, error} или полный расчёт. */
function calcOrder(input, menu, zones, promos, now) {
  var byId = {}; menu.forEach(function (p) { byId[p.id] = p; });
  var zone = null; zones.forEach(function (z) { if (z.id === input.zone) zone = z; });
  if (!zone) return { ok: false, error: 'Выберите зону доставки' };
  var items = input.items || [];
  if (!items.length) return { ok: false, error: 'Корзина пустая' };
  if (items.length > 60) return { ok: false, error: 'Слишком много позиций' };
  var lines = [], sub = 0, hasPaid = false;
  for (var i = 0; i < items.length; i++) {
    var it = items[i], p = byId[String(it.id)], q = Math.floor(Number(it.qty));
    if (!p) return { ok: false, error: 'Позиции нет в меню — обновите страницу' };
    if (!p.available) return { ok: false, error: '«' + p.name + '» закончилось — уберите из корзины' };
    if (!(q >= 1 && q <= 50)) return { ok: false, error: 'Неверное количество' };
    var sum = p.price * q; sub += sum; if (p.price > 0) hasPaid = true;
    lines.push({ id: p.id, name: p.name, qty: q, price: p.price, sum: sum });
  }
  if (!hasPaid) return { ok: false, error: 'Добавьте хотя бы одну позицию из меню' };
  if (sub < zone.min) return { ok: false, error: 'Минимальный заказ в зоне «' + zone.name + '» — ' + zone.min + ' ₽' };
  var pr = promoApply(input.promo, sub, promos, now);
  if (input.promo && !pr.ok) return { ok: false, error: pr.error };
  var disc = pr.ok ? pr.disc : 0;
  var fee = zone.freeFrom && sub >= zone.freeFrom ? 0 : zone.fee;
  return { ok: true, lines: lines, sub: sub, disc: disc, promo: pr.ok ? pr.code : '', fee: fee,
           total: sub - disc + fee, zone: zone };
}

function promoApply(code, sub, promos, now) {
  code = String(code || '').trim().toUpperCase();
  if (!code) return { ok: false, error: '' };
  var p = null; promos.forEach(function (x) { if (x.code === code) p = x; });
  if (!p || !p.active) return { ok: false, error: 'Такого промокода нет' };
  if (p.until && now > new Date(p.until.getTime() + 86400000)) return { ok: false, error: 'Срок промокода истёк' };
  if (p.limit && p.used >= p.limit) return { ok: false, error: 'Промокод уже использован' };
  if (p.min && sub < p.min) return { ok: false, error: 'Промокод действует от ' + p.min + ' ₽' };
  var d = p.type === '%' ? Math.round(sub * p.value / 100) : Math.round(p.value);
  d = Math.max(0, Math.min(d, sub));
  return { ok: true, code: code, disc: d, label: p.label || '' };
}

/**
 * Позиции чека для ЮKassa. Скидка распределяется по позициям пропорционально,
 * в копейках, без потерь: сумма чека всегда равна сумме платежа.
 */
function receiptItems(calc, vatCode, mode) {
  mode = mode || 'full_payment';
  var paid = calc.lines.filter(function (l) { return l.sum > 0; });
  var subK = paid.reduce(function (a, l) { return a + l.sum * 100; }, 0), discK = calc.disc * 100, left = discK, out = [];
  paid.forEach(function (l, i) {
    var lk = l.sum * 100, dk = i === paid.length - 1 ? left : Math.floor(discK * lk / subK);
    left -= dk;
    var net = lk - dk, unit = Math.floor(net / l.qty), rem = net - unit * l.qty;
    if (l.qty - rem > 0) out.push(item_(l.name, l.qty - rem, unit, vatCode, 'commodity', mode));
    if (rem > 0) out.push(item_(l.name, rem, unit + 1, vatCode, 'commodity', mode));
  });
  if (calc.fee > 0) out.push(item_('Доставка', 1, calc.fee * 100, vatCode, 'service', mode));
  return out.filter(function (x) { return Number(x.amount.value) > 0; });
}
function item_(name, qty, unitK, vat, subj, mode) {
  return { description: String(name).slice(0, 128), quantity: String(qty), amount: { value: (unitK / 100).toFixed(2), currency: 'RUB' },
           vat_code: Number(vat) || 1, payment_mode: mode || 'full_payment', payment_subject: subj };
}

function normPhone(s) {
  var d = String(s || '').replace(/\D/g, '');
  if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1);
  if (d.length === 10 && d[0] === '9') d = '7' + d;
  return /^79\d{9}$/.test(d) ? d : '';
}

function newCode_(exists) {
  var a = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  for (var t = 0; t < 50; t++) {
    var c = 'SS'; for (var i = 0; i < 5; i++) c += a[Math.floor(Math.random() * a.length)];
    if (!exists[c]) return c;
  }
  throw new Error('code collision');
}

/* ======================= ЗАКАЗ ======================= */

function createOrder_(b) {
  var s = settings_(), now = new Date();
  if (!yes_(s.OPEN)) userErr_('Кухня сейчас на паузе, заказы не принимаются');
  var name = String(b.name || '').trim().slice(0, 60), phone = normPhone(b.phone), addr = String(b.address || '').trim().slice(0, 200);
  if (!name) userErr_('Укажите имя');
  if (!phone) userErr_('Укажите телефон в формате +7 9XX XXX-XX-XX');
  if (addr.length < 5) userErr_('Укажите адрес');
  var pay = b.pay === 'cash' ? 'cash' : 'online';
  if (pay === 'cash' && !yes_(s.CASH)) userErr_('Оплата курьеру сейчас недоступна — оплатите онлайн');

  var cache = CacheService.getScriptCache(), rk = 'rl_' + phone;
  if (cache.get(rk)) userErr_('Заказ уже отправляется — подождите несколько секунд');
  cache.put(rk, '1', 15);

  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var calc = calcOrder({ items: b.items, zone: b.zone, promo: b.promo }, loadMenu_(), loadZones_(), loadPromos_(), now);
    if (!calc.ok) userErr_(calc.error);
    var orders = readTable_(SH.ORD), exists = {};
    orders.forEach(function (o) { exists[o['Код']] = true; });
    if (calc.promo) {
      var pp = null; loadPromos_().forEach(function (x) { if (x.code === calc.promo) pp = x; });
      if (pp && pp.perPhone && orders.some(function (o) {
            return o['Промокод'] === calc.promo && String(o['Телефон']).replace(/\D/g, '') === phone &&
                   o['Статус'] !== ST.CANCEL && o['Статус'] !== ST.WAIT_PAY; }))
        userErr_('Этот промокод уже использован с вашим номером');
    }
    var code = newCode_(exists);
    var comp = calc.lines.map(function (l) { return l.name + ' × ' + l.qty; }).join('\n');
    var fullAddr = [addr, b.apt ? 'кв. ' + b.apt : '', b.entrance ? 'подъезд ' + b.entrance : '', b.floor ? 'этаж ' + b.floor : '']
                   .filter(String).join(', ');
    var status = pay === 'online' ? ST.WAIT_PAY : (yes_(s.CASH_AUTO) ? ST.NEW : ST.CASH_WAIT);
    var deadline = status === ST.NEW ? new Date(now.getTime() + calc.zone.minutes * 60000) : '';
    var row = rowFor_({
      'Код': code, 'Создан': now, 'Статус': status, 'Оплата': pay === 'online' ? 'онлайн' : 'курьеру', 'Оплачено': 'нет',
      'Имя': name, 'Телефон': '+' + phone, 'Адрес': fullAddr, 'Зона': calc.zone.name,
      'Когда': String(b.when || 'как можно скорее').slice(0, 60), 'Комментарий': String(b.comment || '').slice(0, 300),
      'Состав': comp, 'Товары, ₽': calc.sub, 'Скидка, ₽': calc.disc, 'Промокод': calc.promo, 'Доставка, ₽': calc.fee,
      'Итого, ₽': calc.total, 'Источник': String(b.source || '').slice(0, 120), 'Срок': deadline,
      'Примечание': s.MODE === 'demo' && pay === 'online' ? 'ДЕМО — оплаты не было' : ''
    });
    sheet_(SH.ORD).appendRow(row);
    var it = sheet_(SH.ITEMS);
    calc.lines.forEach(function (l) { it.appendRow([code, now, l.id, l.name, l.qty, l.price, l.sum]); });
    log_('создан', code, pay + ' ' + calc.total + ' ₽');
  } finally { lock.releaseLock(); }

  if (pay === 'cash') {
    if (status === ST.NEW) notifyKitchen_(code);
    return { ok: true, code: code, total: calc.total, status: status };
  }
  if (s.MODE === 'demo') { markPaid_(code, 'demo'); return { ok: true, code: code, total: calc.total, status: ST.NEW, demo: true }; }

  var pmt = ykCreate_(code, calc, phone, s);
  setField_(code, 'ID платежа', pmt.id);
  return { ok: true, code: code, total: calc.total, status: ST.WAIT_PAY, payUrl: pmt.confirmation.confirmation_url };
}

function rowFor_(o) { return HEAD[SH.ORD].map(function (h) { return o[h] === undefined ? '' : o[h]; }); }
function findOrder_(code) {
  code = String(code || '').trim().toUpperCase();
  if (!/^SS[0-9A-Z]{5}$/.test(code)) return null;
  var f = sheet_(SH.ORD).getRange('A:A').createTextFinder(code).matchEntireCell(true).findNext();
  if (!f) return null;
  var r = f.getRow(), v = sheet_(SH.ORD).getRange(r, 1, 1, HEAD[SH.ORD].length).getValues()[0], o = { _row: r };
  HEAD[SH.ORD].forEach(function (h, i) { o[h] = v[i]; });
  return o;
}
function setField_(code, header, value) {
  var o = findOrder_(code); if (!o) throw new Error('нет заказа ' + code);
  sheet_(SH.ORD).getRange(o._row, col_(SH.ORD, header)).setValue(value);
}

function markPaid_(code, how) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var o = findOrder_(code); if (!o || o['Статус'] !== ST.WAIT_PAY) return;
    var zone = null, now = new Date();
    loadZones_().forEach(function (z) { if (z.name === o['Зона']) zone = z; });
    var sh = sheet_(SH.ORD);
    sh.getRange(o._row, col_(SH.ORD, 'Статус')).setValue(ST.NEW);
    sh.getRange(o._row, col_(SH.ORD, 'Оплачено')).setValue(now);
    sh.getRange(o._row, col_(SH.ORD, 'Срок')).setValue(new Date(now.getTime() + (zone ? zone.minutes : 60) * 60000));
    if (o['Промокод']) usePromo_(o['Промокод']);
    log_('оплачен', code, how);
  } finally { lock.releaseLock(); }
  notifyKitchen_(code);
}
function usePromo_(code) {
  loadPromos_().forEach(function (p) {
    if (p.code === code) sheet_(SH.PROMO).getRange(p._row, HEAD[SH.PROMO].indexOf('Использовано') + 1).setValue(p.used + 1);
  });
}

function orderStatus_(code) {
  var o = findOrder_(code); if (!o) return { ok: false, error: 'Заказ не найден' };
  if (o['Статус'] === ST.WAIT_PAY && o['ID платежа']) { syncPayment_(o); o = findOrder_(code); }
  return { ok: true, code: o['Код'], status: o['Статус'], total: o['Итого, ₽'], pay: o['Оплата'],
           deadline: o['Срок'] instanceof Date ? o['Срок'].toISOString() : '' };
}

function checkPromo_(b) {
  var r = promoApply(b.promo, num_(b.sub), loadPromos_(), new Date());
  return r.ok ? { ok: true, code: r.code, disc: r.disc, label: r.label } : { ok: false, error: r.error || 'Такого промокода нет' };
}

/* ======================= ЮKASSA ======================= */

function ykAuth_() {
  var p = PropertiesService.getScriptProperties(), id = p.getProperty('YK_SHOP_ID'), key = p.getProperty('YK_SECRET');
  if (!id || !key) throw new Error('Не заданы YK_SHOP_ID / YK_SECRET в свойствах скрипта');
  return 'Basic ' + Utilities.base64Encode(id + ':' + key);
}
function ykCreate_(code, calc, phone, s) {
  var body = {
    amount: { value: calc.total.toFixed(2), currency: 'RUB' }, capture: true,
    confirmation: { type: 'redirect', return_url: s.SITE_URL + (s.SITE_URL.indexOf('?') < 0 ? '?' : '&') + 'order=' + code },
    description: 'Заказ ' + code, metadata: { order: code }
  };
  if (yes_(s.RECEIPTS)) body.receipt = { customer: { phone: phone }, items: receiptItems(calc, s.VAT_CODE, s.PAYMENT_MODE) };
  var r = UrlFetchApp.fetch('https://api.yookassa.ru/v3/payments', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify(body),
    headers: { Authorization: ykAuth_(), 'Idempotence-Key': code }
  });
  var j = JSON.parse(r.getContentText() || '{}');
  if (r.getResponseCode() >= 300 || !j.confirmation) {
    log_('ЮKassa отказ', code, r.getResponseCode() + ' ' + (j.description || r.getContentText()));
    setField_(code, 'Статус', ST.CANCEL); setField_(code, 'Примечание', 'платёж не создан: ' + (j.description || r.getResponseCode()));
    userErr_('Не получилось открыть оплату. Попробуйте ещё раз или выберите оплату курьеру.');
  }
  return j;
}
function syncPayment_(o) {
  var r = UrlFetchApp.fetch('https://api.yookassa.ru/v3/payments/' + encodeURIComponent(o['ID платежа']),
                            { muteHttpExceptions: true, headers: { Authorization: ykAuth_() } });
  if (r.getResponseCode() !== 200) { log_('ЮKassa статус', o['Код'], r.getResponseCode()); return; }
  var j = JSON.parse(r.getContentText());
  if (j.status === 'succeeded' && j.paid && Number(j.amount.value) === Number(o['Итого, ₽'])) markPaid_(o['Код'], 'ЮKassa ' + j.id);
  else if (j.status === 'succeeded') log_('СУММА НЕ СОВПАЛА', o['Код'], j.amount.value + ' против ' + o['Итого, ₽']);
  else if (j.status === 'canceled') {
    setField_(o['Код'], 'Статус', ST.CANCEL);
    setField_(o['Код'], 'Примечание', 'оплата отменена: ' + ((j.cancellation_details || {}).reason || ''));
  }
}

/** Чек «полный расчёт» после передачи заказа, если первый чек был «предоплата 100%». */
function secondReceipt_(o) {
  var s = settings_();
  if (!yes_(s.RECEIPTS) || s.PAYMENT_MODE !== 'full_prepayment' || s.MODE === 'demo') return;
  var lines = readTable_(SH.ITEMS).filter(function (r) { return r['Код заказа'] === o['Код']; })
    .map(function (r) { return { name: r['Название'], qty: num_(r['Кол-во']), price: num_(r['Цена, ₽']), sum: num_(r['Сумма, ₽']) }; });
  var calc = { lines: lines, disc: num_(o['Скидка, ₽']), fee: num_(o['Доставка, ₽']) };
  var total = num_(o['Итого, ₽']);
  var body = { type: 'payment', payment_id: o['ID платежа'], send: true,
               customer: { phone: String(o['Телефон']).replace(/\D/g, '') },
               items: receiptItems(calc, s.VAT_CODE, 'full_payment'),
               settlements: [{ type: 'prepayment', amount: { value: total.toFixed(2), currency: 'RUB' } }] };
  var r = UrlFetchApp.fetch('https://api.yookassa.ru/v3/receipts', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify(body),
    headers: { Authorization: ykAuth_(), 'Idempotence-Key': o['Код'] + '-final' } });
  log_(r.getResponseCode() < 300 ? 'второй чек' : 'ОШИБКА второго чека', o['Код'], r.getResponseCode() + ' ' + r.getContentText().slice(0, 200));
}

/** Триггер раз в минуту: подтверждает оплаты, если клиент не вернулся на сайт, и снимает брошенные. */
function pollPending() {
  var s = settings_(), lim = (num_(s.UNPAID_CANCEL_MIN) || 30) * 60000, now = Date.now();
  readTable_(SH.ORD).forEach(function (o) {
    if (o['Статус'] !== ST.WAIT_PAY) return;
    try { if (o['ID платежа']) syncPayment_(o); } catch (x) { log_('ОШИБКА опроса', o['Код'], x.message); }
    var cur = findOrder_(o['Код']);
    if (cur && cur['Статус'] === ST.WAIT_PAY && now - new Date(cur['Создан']).getTime() > lim) {
      setField_(o['Код'], 'Статус', ST.CANCEL); setField_(o['Код'], 'Примечание', 'не оплачен за ' + (lim / 60000) + ' мин');
    }
  });
}

/* ======================= КУХНЯ ======================= */

function kitchenList_() {
  var items = {};
  readTable_(SH.ITEMS).forEach(function (r) { (items[r['Код заказа']] = items[r['Код заказа']] || []).push({ name: r['Название'], qty: r['Кол-во'] }); });
  var list = readTable_(SH.ORD).filter(function (o) { return KITCHEN_ACTIVE.indexOf(o['Статус']) >= 0; }).map(function (o) {
    return { code: o['Код'], status: o['Статус'], created: iso_(o['Создан']), deadline: iso_(o['Срок']), pay: o['Оплата'],
             name: o['Имя'], phone: o['Телефон'], address: o['Адрес'], zone: o['Зона'], when: o['Когда'], comment: o['Комментарий'],
             total: o['Итого, ₽'], items: items[o['Код']] || [], note: o['Примечание'] };
  });
  list.sort(function (a, b) { return a.created < b.created ? -1 : 1; });
  return { ok: true, now: new Date().toISOString(), orders: list };
}
function iso_(d) { return d instanceof Date ? d.toISOString() : ''; }

function setStatus_(code, status) {
  var o = findOrder_(code); if (!o) userErr_('Заказ не найден');
  if (status === ST.CANCEL) { setField_(code, 'Статус', ST.CANCEL); log_('отменён кухней', code, ''); return { ok: true }; }
  if (NEXT[o['Статус']] !== status) userErr_('Статус уже изменён — обновите экран');
  setField_(code, 'Статус', status); setField_(code, STAMP[status], new Date());
  log_('статус', code, status);
  if (status === ST.DONE && o['Оплата'] === 'онлайн' && o['ID платежа']) {
    try { secondReceipt_(o); } catch (x) { log_('ОШИБКА второго чека', code, x.message); }
  }
  return { ok: true };
}
function confirmCash_(code, accept) {
  var o = findOrder_(code); if (!o || o['Статус'] !== ST.CASH_WAIT) userErr_('Заказ уже обработан');
  if (!accept) { setField_(code, 'Статус', ST.CANCEL); setField_(code, 'Примечание', 'наличные: не подтверждён'); return { ok: true }; }
  var zone = null; loadZones_().forEach(function (z) { if (z.name === o['Зона']) zone = z; });
  setField_(code, 'Статус', ST.NEW);
  setField_(code, 'Срок', new Date(Date.now() + (zone ? zone.minutes : 60) * 60000));
  if (o['Промокод']) usePromo_(o['Промокод']);
  log_('наличные подтверждены', code, '');
  return { ok: true };
}

function notifyKitchen_(code) {
  var p = PropertiesService.getScriptProperties(), t = p.getProperty('TG_BOT_TOKEN'), chat = p.getProperty('TG_CHAT_ID');
  if (!t || !chat) return;
  var o = findOrder_(code); if (!o) return;
  var txt = '🍣 Новый заказ ' + code + ' · ' + o['Итого, ₽'] + ' ₽ (' + o['Оплата'] + ')\n' + o['Состав'] + '\n📍 ' + o['Зона'] + ', ' +
            o['Адрес'] + '\n⏱ ' + o['Когда'] + (o['Комментарий'] ? '\n💬 ' + o['Комментарий'] : '');
  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + t + '/sendMessage',
      { method: 'post', muteHttpExceptions: true, payload: { chat_id: chat, text: txt } });
  } catch (x) { log_('ОШИБКА Telegram', code, x.message); }
}

/* ======================= УСТАНОВКА ======================= */

/** Запустить один раз из редактора: создаст листы, шапки, пример меню и триггер. Повторный запуск ничего не стирает. */
function setup() {
  var ss = ss_();
  Object.keys(HEAD).forEach(function (n) {
    var s = ss.getSheetByName(n) || ss.insertSheet(n);
    if (s.getLastRow() === 0) { s.appendRow(HEAD[n]); s.setFrozenRows(1); s.getRange(1, 1, 1, HEAD[n].length).setFontWeight('bold'); }
  });
  var set = ss.getSheetByName(SH.SET); if (set.getLastRow() === 1) SETTINGS_DEFAULT.forEach(function (r) { set.appendRow(r); });
  var m = ss.getSheetByName(SH.MENU); if (m.getLastRow() === 1) SEED_MENU.forEach(function (r) { m.appendRow(r); });
  var z = ss.getSheetByName(SH.ZONES); if (z.getLastRow() === 1) SEED_ZONES.forEach(function (r) { z.appendRow(r); });
  var p = ss.getSheetByName(SH.PROMO); if (p.getLastRow() === 1) p.appendRow(['ANNINO10', '%', 10, 0, '', 0, 0, 'да', '−10% на первый заказ (пример)', 'да']);
  var k = ss.getSheetByName(SH.KITCHEN) || ss.insertSheet(SH.KITCHEN);
  k.getRange('A1').setFormula('=QUERY(\'' + SH.ORD + '\'!A1:Y, "select A,B,C,M,K,L,J,I,T,R,D where C=\'' + ST.CASH_WAIT + '\' or C=\'' +
    ST.NEW + '\' or C=\'' + ST.COOK + '\' or C=\'' + ST.READY + '\' or C=\'' + ST.COURIER + '\' order by B", 1)');
  ss.getSheetByName(SH.ORD).getRange('B:B').setNumberFormat('dd.MM HH:mm');
  ss.getSheetByName(SH.ORD).getRange('E:E').setNumberFormat('dd.MM HH:mm');
  ss.getSheetByName(SH.ORD).getRange('T:X').setNumberFormat('dd.MM HH:mm');
  if (!ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'pollPending'; }))
    ScriptApp.newTrigger('pollPending').timeBased().everyMinutes(1).create();
  var pr = PropertiesService.getScriptProperties();
  if (!pr.getProperty('KITCHEN_KEY')) pr.setProperty('KITCHEN_KEY', Utilities.getUuid().replace(/-/g, ''));
  Logger.log('Готово. Ключ кухни лежит в Свойствах скрипта → KITCHEN_KEY (никому не пересылать в открытых чатах).');
}

/* Пример меню и зон — из прототипа; цены и веса уточнить с кухней. */
var SEED_MENU = [
  ['set-sosed', 'Сеты', 'Сет «Сосед» из половинок', 1590, 840, '', 24, 'да', 'да', 'set-half', 'Попробовать всё и не переесть: по половинке Филадельфии, Унаги, запечённого с крабом и ролла с огурцом и кунжутом.', 'Лосось, угорь, снежный краб, сливочный сыр, огурец, авокадо, рис, нори, кунжут, соус унаги.'],
  ['set-big', 'Сеты', 'Сет «Большой ЖК»', 2490, 1360, '', 40, 'да', 'да', 'set-big', 'На компанию 3–4 человек: Филадельфия, Калифорния, запечённые и маки с огурцом.', 'Лосось, снежный краб, тобико, сливочный сыр, огурец, сырный соус, рис, нори.'],
  ['set-baked', 'Сеты', 'Сет «Тёплый вечер»', 1990, 1100, '', 32, 'да', 'нет', 'set-baked', 'Только запечённые роллы с сырной шапкой, соусом унаги и тобико.', 'Снежный краб, креветка, лосось, огурец, сырный соус, тобико, соус унаги, кунжут.'],
  ['phila', 'Роллы', 'Филадельфия', 619, 260, '', 8, 'да', 'да', 'philadelphia', 'Классика с толстым слоем лосося. Видно рыбу, а не рис.', 'Лосось охлаждённый, сливочный сыр, огурец, рис, нори.'],
  ['california', 'Роллы', 'Калифорния с тобико', 549, 250, '', 8, 'да', 'нет', 'california', 'Снежный краб, авокадо и огурец в оранжевой икре тобико.', 'Снежный краб, авокадо, огурец, сливочный сыр, тобико, рис, нори.'],
  ['unagi', 'Роллы', 'Канада с угрём', 679, 260, '', 8, 'да', 'нет', 'unagi', 'Копчёный угорь и авокадо сверху, внутри креветка и огурец.', 'Угорь, авокадо, креветка, огурец, сливочный сыр, соус унаги, кунжут, рис, нори.'],
  ['maki', 'Роллы', 'Маки: лосось и огурец', 349, 210, '', 12, 'да', 'нет', 'maki', 'Лёгкие маки — по 6 шт. с лососем и огурцом.', 'Лосось, огурец, рис, нори.'],
  ['baked-crab', 'Запечённые', 'Запечённый с крабом', 549, 280, '', 8, 'да', 'да', 'baked', 'Горячая сырная шапка, соус унаги и тобико. Самый «уютный» ролл.', 'Снежный краб, огурец, сливочный сыр, сырный соус, тобико, соус унаги, кунжут, рис, нори.'],
  ['baked-salmon', 'Запечённые', 'Запечённый с лососем', 589, 280, '', 8, 'да', 'нет', 'set-baked', 'Лосось и сыр внутри, сверху запечённый сырный соус.', 'Лосось, сливочный сыр, огурец, сырный соус, тобико, соус унаги, рис, нори.'],
  ['tempura-salmon', 'Горячие роллы', 'Темпура с лососем', 579, 290, '', 8, 'да', 'нет', 'tempura', 'Хрустящая панировка снаружи, горячий лосось и сливочный сыр внутри.', 'Лосось, сливочный сыр, панко, кляр, спайси, соус унаги, рис, нори.'],
  ['tempura-chicken', 'Горячие роллы', 'Темпура с курицей', 489, 290, '', 8, 'да', 'нет', 'tempura', 'Для тех, кто не ест сырую рыбу: курица терияки в хрустящей панировке.', 'Курица терияки, сливочный сыр, огурец, панко, кляр, соус унаги, рис, нори.'],
  ['nigiri-mix', 'Суши', 'Нигири ассорти', 420, 140, '', 4, 'да', 'нет', 'nigiri', 'Лосось, тунец, угорь и креветка — по одному.', 'Лосось, тунец, угорь, креветка, рис, соус унаги.'],
  ['gunkan', 'Суши', 'Гунканы спайси лосось', 390, 120, '', 3, 'да', 'нет', 'gunkan', 'Рубленый лосось со спайси и икрой тобико в хрустящем нори.', 'Лосось, спайси-соус, тобико, зелёный лук, рис, нори.'],
  ['lemonade', 'Напитки', 'Лимонад юдзу', 220, '', 500, '', 'да', 'нет', 'drinks', 'Освежающий цитрусовый лимонад.', 'Вода, сок юдзу и лимона, сахарный сироп, лёд.'],
  ['greentea', 'Напитки', 'Холодный зелёный чай', 190, '', 500, '', 'да', 'нет', 'drinks', 'Несладкий холодный зелёный чай.', 'Зелёный чай, лимон.'],
  ['sauce-free', 'Соусы', 'Соевый, имбирь, васаби', 0, 70, '', '', 'да', 'нет', 'sauces', 'Кладём бесплатно к каждому заказу роллов. Нужно больше — добавьте.', 'Соевый соус 40 мл, имбирь 20 г, васаби 10 г.'],
  ['spicy', 'Соусы', 'Соус спайси', 60, 40, '', '', 'да', 'нет', 'sauces', 'Острый сливочный соус.', 'Майонез, соус чили, кунжутное масло.'],
  ['unagi-sauce', 'Соусы', 'Соус унаги', 60, 40, '', '', 'да', 'нет', 'sauces', 'Сладковатый соус для угря и запечённых роллов.', 'Соевый соус, сахар, мирин.']
];
var SEED_ZONES = [
  ['annino', 'Аннино, Аннинские Высоты', 700, 0, 0, '40 мин', 40, 'да', 'да'],
  ['novosele', 'Новоселье', 800, 150, 1500, '40–60 мин', 60, 'нет', 'да'],
  ['gorelovo', 'Горелово, Новогорелово', 900, 200, 2000, '60–75 мин', 75, 'нет', 'да'],
  ['krasnoe', 'Красное Село', 900, 250, 2500, '60–75 мин', 75, 'нет', 'да']
];

/* Для проверки расчёта вне Google (node backend/test.js). */
if (typeof module !== 'undefined') module.exports = { calcOrder: calcOrder, promoApply: promoApply, receiptItems: receiptItems, normPhone: normPhone };
