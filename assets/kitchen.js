/* Экран кухни: активные заказы из таблицы, таймер до срока, смена статуса одной кнопкой. */
const API = (window.SOSED_CONFIG||{}).API || '';
const $ = s=>document.querySelector(s);
const esc = s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const NEXT = {'НОВЫЙ':'ГОТОВИТСЯ','ГОТОВИТСЯ':'ГОТОВ','ГОТОВ':'У КУРЬЕРА','У КУРЬЕРА':'ДОСТАВЛЕН'};
const LABEL = {'НОВЫЙ':'Взять в работу','ГОТОВИТСЯ':'Готово','ГОТОВ':'Отдать курьеру','У КУРЬЕРА':'Доставлен'};
let KEY = ''; try{ KEY = new URLSearchParams(location.hash.slice(1)).get('k') || localStorage.getItem('kitchen_key') || ''; }catch(e){}
if(location.hash) history.replaceState(null,'',location.pathname);
let orders = [], skew = 0, seen = null, audio = null;

function saveKey(k){ KEY=k; try{ localStorage.setItem('kitchen_key',k); }catch(e){} }
async function load(){
  if(!API){ $('#list').innerHTML='<div class="empty">Не задан адрес сервера (assets/config.js)</div>'; return; }
  if(!KEY){ $('#login').hidden=false; return; }
  try{
    const r = await fetch(API+(API.includes('?')?'&':'?')+'action=kitchen&key='+encodeURIComponent(KEY)).then(r=>r.json());
    if(!r.ok){ if(/доступа/.test(r.error)){ saveKey(''); $('#login').hidden=false; } $('#info').textContent=r.error; return; }
    $('#login').hidden=true; saveKey(KEY);
    skew = Date.parse(r.now) - Date.now(); orders = r.orders;
    const codes = new Set(orders.map(o=>o.code));
    if(seen && [...codes].some(c=>!seen.has(c))) beep();
    seen = codes; render();
    $('#info').textContent = 'Обновлено ' + new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  }catch(e){ $('#info').textContent = 'Нет связи — повторяю…'; }
}
function left(o){ if(!o.deadline) return null; return Math.round((Date.parse(o.deadline) - (Date.now()+skew))/60000); }
function render(){
  if(!orders.length){ $('#list').innerHTML='<div class="empty muted">Активных заказов нет</div>'; return; }
  $('#list').innerHTML = orders.map(o=>{
    const m = left(o), cash = o.status==='НАЛИЧНЫЕ: ПОДТВЕРДИТЬ';
    const t = m==null?'':`<span class="timer ${m<0?'late':m<=10?'soon':''}">${m<0?'−'+Math.abs(m):m} мин</span>`;
    return `<article class="o ${m!=null&&m<0?'late':''} ${cash?'cash':''}">
      <div class="top"><span class="code">${esc(o.code)}</span>${t}</div>
      <div><span class="st">${esc(o.status)}</span> <span class="small muted">${new Date(o.created).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})} · ${esc(o.pay)} · ${esc(o.total)} ₽</span></div>
      <ul>${o.items.map(i=>`<li><b>${esc(i.qty)}×</b> ${esc(i.name)}</li>`).join('')}</ul>
      <div class="small">⏱ ${esc(o.when)}${o.comment?`<br>💬 ${esc(o.comment)}`:''}</div>
      <div class="small muted">📍 ${esc(o.zone)}, ${esc(o.address)}<br>📞 <a style="color:inherit" href="tel:${esc(o.phone)}">${esc(o.phone)}</a> · ${esc(o.name)}</div>
      ${o.note?`<div class="small" style="color:var(--warn)">${esc(o.note)}</div>`:''}
      ${cash?`<div class="small" style="color:var(--warn)">Оплата курьеру: подтвердите, когда клиент написал в мессенджер с этим кодом</div>
        <div class="row"><button class="okb" data-cash="${esc(o.code)}" data-yes="1">Подтвердить</button><button class="ghost" data-cash="${esc(o.code)}">Отменить</button></div>`
        :`<button class="next" data-code="${esc(o.code)}" data-to="${esc(NEXT[o.status]||'')}">${esc(LABEL[o.status]||'')}</button>`}
    </article>`;}).join('');
}
async function post(body, btn){
  btn.disabled = true;
  try{ const r = await fetch(API,{method:'POST',body:JSON.stringify(Object.assign({key:KEY},body))}).then(r=>r.json());
       if(!r.ok) alert(r.error); }catch(e){ alert('Нет связи — попробуйте ещё раз'); }
  load();
}
function beep(){ if(!audio) return; const o=audio.createOscillator(), g=audio.createGain(); o.frequency.value=880; o.connect(g); g.connect(audio.destination);
  g.gain.setValueAtTime(.3,audio.currentTime); o.start(); o.stop(audio.currentTime+.6); if(navigator.vibrate) navigator.vibrate(300); }
document.addEventListener('click', e=>{
  const b = e.target.closest('button'); if(!b) return;
  if(b.id==='go'){ saveKey($('#key').value.trim()); load(); return; }
  if(b.id==='sound'){ audio = audio || new (window.AudioContext||window.webkitAudioContext)(); beep(); b.textContent='🔔 Звук включён'; return; }
  if(b.dataset.code && b.dataset.to) post({action:'setStatus', code:b.dataset.code, status:b.dataset.to}, b);
  if(b.dataset.cash) post({action:'confirmCash', code:b.dataset.cash, accept:!!b.dataset.yes}, b);
});
load(); setInterval(load, 15000); setInterval(render, 30000);
