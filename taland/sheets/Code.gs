/**
 * ТаланД → Google Таблица. Веб-приложение Apps Script принимает от сайта заказы и события.
 *
 * Сайт шлёт POST {secret, items:[{id, kind:'order'|'events', payload}]}. Ответ {ok, done:[id...]} —
 * сайт отмечает отправленным только то, что таблица подтвердила; остальное пришлёт снова.
 *
 * Ключ — в Свойствах скрипта: SHEETS_SECRET (та же строка, что в .env сайта). В коде и в таблице его нет.
 * Скрипт пишет только колонки данных. Формулы (колонки «В выручку», «Дата выручки», «Статус заказа»,
 * листы «Кухня», «Деньги», «Реклама», «Блюда», «Воронка») он не трогает.
 */

var SH = { ORD: 'Заказы', ITEMS: 'Позиции', EV: 'События', LOG: 'Журнал агентов' };

var ORD_HEAD = ['№', 'Создан', 'Статус', 'Оплата', 'Оплачено', 'Имя', 'Телефон', 'Адрес', 'Район', 'Комментарий', 'Состав',
  'Блюда, ₽', 'Скидка, ₽', 'Промокод', 'Доставка, ₽', 'Итого, ₽', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term',
  'yclid', 'vk_click', 'Страница входа', 'Подтверждён', 'На кухне', 'Готов', 'У курьера', 'Доставлен', 'Отменён', 'Обновлено'];
var ITEMS_HEAD = ['№ заказа', 'Создан', 'Блюдо', 'Вариант', 'Кол-во', 'Цена, ₽', 'Сумма, ₽'];
var EV_HEAD = ['Время', 'Сессия', 'Событие', 'Страница', 'Кнопка', 'Параметры', 'Сумма, ₽', 'Источник', 'Кампания'];

/** Статус → колонка, куда ставится время первого перехода в него. */
var STAMP = { 'Подтверждён': 'Подтверждён', 'На кухне': 'На кухне', 'Готов': 'Готов', 'У курьера': 'У курьера', 'Доставлен': 'Доставлен', 'Отменён': 'Отменён' };

function doPost(e) {
  var body;
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x) { return out_({ ok: false, error: 'bad json' }); }
  var key = PropertiesService.getScriptProperties().getProperty('SHEETS_SECRET');
  if (!key || body.secret !== key) return out_({ ok: false, error: 'нет доступа' });
  var items = Array.isArray(body.items) ? body.items.slice(0, 100) : [];
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  var done = [];
  try {
    var evRows = [], evIds = [];
    items.forEach(function (it) {
      try {
        if (it.kind === 'events') {
          (it.payload || []).forEach(function (ev) { evRows.push(eventRow_(ev)); });
          evIds.push(it.id);
        } else if (it.kind === 'order') {
          upsertOrder_(it.payload);
          done.push(it.id);
        }
      } catch (err) { log_('ошибка записи', String(it.kind), String(err && err.message || err)); }
    });
    if (evRows.length) {
      var ev = sheet_(SH.EV, EV_HEAD);
      ev.getRange(ev.getLastRow() + 1, 1, evRows.length, EV_HEAD.length).setValues(evRows);
    }
    done = done.concat(evIds);
  } finally { lock.releaseLock(); }
  return out_({ ok: true, done: done });
}

function doGet() { return out_({ ok: true, service: 'taland-sheets' }); }

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function sheet_(name, head) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName(name);
  if (!s) { s = ss.insertSheet(name); }
  if (head && s.getLastRow() === 0) { s.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold'); s.setFrozenRows(1); }
  return s;
}

function d_(iso) { var d = iso ? new Date(iso) : null; return d && !isNaN(d.getTime()) ? d : ''; }

function eventRow_(ev) {
  var params = ev.params || '';
  if (typeof params !== 'string') params = JSON.stringify(params);
  return [d_(ev.at), String(ev.session || ''), String(ev.goal || ''), String(ev.page || ''), String(ev.label || ''),
    params.slice(0, 500), ev.value === null || ev.value === undefined ? '' : Number(ev.value), String(ev.source || ''), String(ev.campaign || '')];
}

function upsertOrder_(o) {
  var s = sheet_(SH.ORD, ORD_HEAD);
  var found = s.getRange('A:A').createTextFinder(String(o.number)).matchEntireCell(true).findNext();
  var rowNo = found ? found.getRow() : s.getLastRow() + 1;
  var cur = found ? s.getRange(rowNo, 1, 1, ORD_HEAD.length).getValues()[0] : ORD_HEAD.map(function () { return ''; });
  var at = d_(o.changedAt) || new Date();
  var col = function (h) { return ORD_HEAD.indexOf(h); };
  var comp = (o.lines || []).map(function (l) { return l.item + (l.variant ? ', ' + l.variant : '') + ' × ' + l.qty; }).join('; ');
  var row = cur.slice();
  var set = function (h, v) { row[col(h)] = v; };
  set('№', o.number); set('Создан', d_(o.createdAt)); set('Статус', o.status); set('Оплата', o.payment);
  if (o.paid && !cur[col('Оплачено')]) set('Оплачено', at);
  set('Имя', o.name); set('Телефон', o.phone ? "'+" + String(o.phone).replace(/^\+/, '') : ''); set('Адрес', o.address); set('Район', o.zone);
  set('Комментарий', o.comment); set('Состав', comp); set('Блюда, ₽', o.subtotal); set('Скидка, ₽', o.discount);
  set('Промокод', o.promo); set('Доставка, ₽', o.delivery); set('Итого, ₽', o.total);
  set('utm_source', o.utm_source); set('utm_medium', o.utm_medium); set('utm_campaign', o.utm_campaign); set('utm_term', o.utm_term);
  set('yclid', o.yclid); set('vk_click', o.vk_click); set('Страница входа', o.landing);
  var stampCol = STAMP[o.status];
  if (stampCol && !cur[col(stampCol)]) set(stampCol, at);
  set('Обновлено', new Date());
  s.getRange(rowNo, 1, 1, ORD_HEAD.length).setValues([row]);
  if (!found && (o.lines || []).length) {
    var items = sheet_(SH.ITEMS, ITEMS_HEAD);
    var rows = o.lines.map(function (l) { return [o.number, d_(o.createdAt), l.item, l.variant || '', l.qty, l.price, l.sum]; });
    items.getRange(items.getLastRow() + 1, 1, rows.length, ITEMS_HEAD.length).setValues(rows);
  }
}

function log_(what, kind, details) {
  try { sheet_(SH.LOG).appendRow([new Date(), 'скрипт таблицы', what + ' (' + kind + ')', details.slice(0, 500), '', '']); } catch (x) { /* */ }
}

/** Проверка из редактора: создаёт тестовый заказ ТЕСТ-0001 и событие. Потом удалить эти строки руками. */
function selfTest() {
  upsertOrder_({ number: 'ТЕСТ-0001', createdAt: new Date().toISOString(), changedAt: new Date().toISOString(), status: 'На кухне', payment: 'Онлайн (ЮKassa)', paid: true,
    name: 'Тест', phone: '79990000000', address: 'проверка', zone: 'Аннино', comment: '', promo: '', subtotal: 619, discount: 0, delivery: 0, total: 619,
    utm_source: 'test', lines: [{ item: 'Филадельфия', variant: 'Лосось', qty: 1, price: 619, sum: 619 }] });
  var ev = sheet_(SH.EV, EV_HEAD);
  ev.appendRow(eventRow_({ at: new Date().toISOString(), session: 'test', goal: 'self_test', page: '/', label: 'проверка' }));
}

if (typeof module !== 'undefined') module.exports = { doPost: doPost, ORD_HEAD: ORD_HEAD, ITEMS_HEAD: ITEMS_HEAD, EV_HEAD: EV_HEAD };
