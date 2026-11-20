/* ====== НАСТРОЙКИ БРЕНДА — поменять название здесь, одной строкой ====== */
const BRAND = 'Сосед-сан';
/* ======================================================================= */

/* Все цифры ниже — ПРИМЕР для прототипа, уточнить с кухней. */
let ZONES = [
  { id:'annino',   name:'Аннино, Аннинские Высоты', min:700, fee:0,   freeFrom:0,    time:'40 мин',    near:true },
  { id:'novosele', name:'Новоселье',                min:800, fee:150, freeFrom:1500, time:'40–60 мин', near:false },
  { id:'gorelovo', name:'Горелово, Новогорелово',   min:900, fee:200, freeFrom:2000, time:'60–75 мин', near:false },
  { id:'krasnoe',  name:'Красное Село',             min:900, fee:250, freeFrom:2500, time:'60–75 мин', near:false },
];
let PROMOS = { ANNINO10:{ pct:10, label:'−10% на первый заказ (пример)' } };

let CATS = ['Сеты','Роллы','Запечённые','Горячие роллы','Суши','Напитки','Соусы'];
let P = [
  {id:'set-sosed', cat:'Сеты', name:'Сет «Сосед» из половинок', img:'set-half', pcs:24, g:840, price:1590, hit:true,
   desc:'Попробовать всё и не переесть: по половинке Филадельфии, Унаги, запечённого с крабом и ролла с огурцом и кунжутом.',
   comp:'Лосось, угорь, снежный краб, сливочный сыр, огурец, авокадо, рис, нори, кунжут, соус унаги.'},
  {id:'set-big', cat:'Сеты', name:'Сет «Большой ЖК»', img:'set-big', pcs:40, g:1360, price:2490, hit:true,
   desc:'На компанию 3–4 человек: Филадельфия, Калифорния, запечённые и маки с огурцом.',
   comp:'Лосось, снежный краб, тобико, сливочный сыр, огурец, сырный соус, рис, нори.'},
  {id:'set-baked', cat:'Сеты', name:'Сет «Тёплый вечер»', img:'set-baked', pcs:32, g:1100, price:1990,
   desc:'Только запечённые роллы с сырной шапкой, соусом унаги и тобико.',
   comp:'Снежный краб, креветка, лосось, огурец, сырный соус, тобико, соус унаги, кунжут.'},
  {id:'phila', cat:'Роллы', name:'Филадельфия', img:'philadelphia', pcs:8, g:260, price:619, hit:true,
   desc:'Классика с толстым слоем лосося. Видно рыбу, а не рис.',
   comp:'Лосось охлаждённый, сливочный сыр, огурец, рис, нори.'},
  {id:'california', cat:'Роллы', name:'Калифорния с тобико', img:'california', pcs:8, g:250, price:549,
   desc:'Снежный краб, авокадо и огурец в оранжевой икре тобико.',
   comp:'Снежный краб, авокадо, огурец, сливочный сыр, тобико, рис, нори.'},
  {id:'unagi', cat:'Роллы', name:'Канада с угрём', img:'unagi', pcs:8, g:260, price:679,
   desc:'Копчёный угорь и авокадо сверху, внутри креветка и огурец.',
   comp:'Угорь, авокадо, креветка, огурец, сливочный сыр, соус унаги, кунжут, рис, нори.'},
  {id:'maki', cat:'Роллы', name:'Маки: лосось и огурец', img:'maki', pcs:12, g:210, price:349,
   desc:'Лёгкие маки — по 6 шт. с лососем и огурцом.',
   comp:'Лосось, огурец, рис, нори.'},
  {id:'baked-crab', cat:'Запечённые', name:'Запечённый с крабом', img:'baked', pcs:8, g:280, price:549, hit:true,
   desc:'Горячая сырная шапка, соус унаги и тобико. Самый «уютный» ролл.',
   comp:'Снежный краб, огурец, сливочный сыр, сырный соус, тобико, соус унаги, кунжут, рис, нори.'},
  {id:'baked-salmon', cat:'Запечённые', name:'Запечённый с лососем', img:'set-baked', pcs:8, g:280, price:589,
   desc:'Лосось и сыр внутри, сверху запечённый сырный соус.',
   comp:'Лосось, сливочный сыр, огурец, сырный соус, тобико, соус унаги, рис, нори.'},
  {id:'tempura-salmon', cat:'Горячие роллы', name:'Темпура с лососем', img:'tempura', pcs:8, g:290, price:579,
   desc:'Хрустящая панировка снаружи, горячий лосось и сливочный сыр внутри.',
   comp:'Лосось, сливочный сыр, панко, кляр, спайси, соус унаги, рис, нори.'},
  {id:'tempura-chicken', cat:'Горячие роллы', name:'Темпура с курицей', img:'tempura', pcs:8, g:290, price:489,
   desc:'Для тех, кто не ест сырую рыбу: курица терияки в хрустящей панировке.',
   comp:'Курица терияки, сливочный сыр, огурец, панко, кляр, соус унаги, рис, нори.'},
  {id:'nigiri-mix', cat:'Суши', name:'Нигири ассорти', img:'nigiri', pcs:4, g:140, price:420,
   desc:'Лосось, тунец, угорь и креветка — по одному.',
   comp:'Лосось, тунец, угорь, креветка, рис, соус унаги.'},
  {id:'gunkan', cat:'Суши', name:'Гунканы спайси лосось', img:'gunkan', pcs:3, g:120, price:390,
   desc:'Рубленый лосось со спайси и икрой тобико в хрустящем нори.',
   comp:'Лосось, спайси-соус, тобико, зелёный лук, рис, нори.'},
  {id:'lemonade', cat:'Напитки', name:'Лимонад юдзу', img:'drinks', ml:500, price:220,
   desc:'Освежающий цитрусовый лимонад.', comp:'Вода, сок юдзу и лимона, сахарный сироп, лёд.'},
  {id:'greentea', cat:'Напитки', name:'Холодный зелёный чай', img:'drinks', ml:500, price:190,
   desc:'Несладкий холодный зелёный чай.', comp:'Зелёный чай, лимон.'},
  {id:'sauce-free', cat:'Соусы', name:'Соевый, имбирь, васаби', img:'sauces', g:70, price:0,
   desc:'Кладём бесплатно к каждому заказу роллов. Нужно больше — добавьте.', comp:'Соевый соус 40 мл, имбирь 20 г, васаби 10 г.'},
  {id:'spicy', cat:'Соусы', name:'Соус спайси', img:'sauces', g:40, price:60,
   desc:'Острый сливочный соус.', comp:'Майонез, соус чили, кунжутное масло.'},
  {id:'unagi-sauce', cat:'Соусы', name:'Соус унаги', img:'sauces', g:40, price:60,
   desc:'Сладковатый соус для угря и запечённых роллов.', comp:'Соевый соус, сахар, мирин.'},
];

/* ---------- helpers ---------- */
const $ = (s,el=document)=>el.querySelector(s);
const $$ = (s,el=document)=>[...el.querySelectorAll(s)];
const rub = n => n.toLocaleString('ru-RU').replace(/\u00a0/g,' ') + ' ₽';
const byId = id => P.find(p=>p.id===id);
const weight = p => p.ml ? `${p.ml} мл` : `${p.g} г${p.pcs?` · ${p.pcs} шт`:''}`;
const perKg = p => p.g && p.price && p.cat==='Сеты' ? `${rub(Math.round(p.price/p.g*1000))}/кг` : '';
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- сервер заказов ---------- */
const API = (window.SOSED_CONFIG||{}).API || '';
let MSG = {telegram:'', whatsapp:'', max:''}, SERVER = {open:true, cash:true, mode:'proto'};
async function api(action, data){
  const r = data ? await fetch(API, {method:'POST', body: JSON.stringify(Object.assign({action}, data))})
                 : await fetch(API + (API.includes('?')?'&':'?') + 'action=' + action);
  return r.json();
}
async function apiGet(params){ const q=new URLSearchParams(params).toString(); const r=await fetch(API+(API.includes('?')?'&':'?')+q); return r.json(); }
async function loadServerMenu(){
  try{
    const j = await api('menu');
    if(!j.ok) throw new Error(j.error||'menu');
    P = j.menu.filter(p=>p.available).map(p=>Object.assign({}, p, {img: p.img||'set-half'}));
    ZONES = j.zones; MSG = j.messengers||MSG; SERVER = {open:j.open, cash:j.cash, mode:j.mode};
    CATS = [...new Set(P.map(p=>p.cat))];
    if(!CATS.includes(curCat)) curCat = CATS[0];
    for(const id of Object.keys(S.cart)) if(!byId(id)) delete S.cart[id];
    if(!ZONES.some(z=>z.id===S.zone) && ZONES[0]) S.zone = ZONES[0].id;
    save(); renderTabs(); renderGrid(); renderPopular(); renderZones(); renderCartUI();
    if(!SERVER.open) toast('Кухня сейчас на паузе — заказы не принимаются');
  }catch(e){ console.warn('menu', e); toast('Меню не загрузилось — обновите страницу'); }
}
/* откуда пришёл клиент — для учёта рекламы */
(function(){ try{
  const u=new URLSearchParams(location.search), src=[u.get('utm_source'),u.get('utm_campaign'),u.get('promo')].filter(Boolean).join(' / ');
  if(src || (document.referrer && !document.referrer.includes(location.host))) sessionStorage.setItem('sosed_src', src || document.referrer.slice(0,120));
}catch(e){} })();
const source = ()=>{ try{ return sessionStorage.getItem('sosed_src')||'прямой'; }catch(e){ return ''; } };

const KEY='sosedsan_proto_v1';
let saved={}; try{ saved=JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){}
const S = Object.assign({cart:{}, zone:'annino', promo:'', promoDisc:0, step:'cart', pay:'online', when:'asap'}, saved);
const save = ()=>{ try{ localStorage.setItem(KEY, JSON.stringify({cart:S.cart, zone:S.zone, promo:S.promo, promoDisc:S.promoDisc, pay:S.pay, when:S.when})); }catch(e){} };
const zone = ()=>ZONES.find(z=>z.id===S.zone)||ZONES[0];

function totals(){
  let sub=0, n=0;
  for(const [id,q] of Object.entries(S.cart)){ const p=byId(id); if(!p) continue; sub+=p.price*q; n+=q; }
  const z=zone(), promo=PROMOS[S.promo];
  const disc = API ? Math.min(S.promoDisc||0, sub) : (promo ? Math.round(sub*promo.pct/100) : 0);
  const fee = sub===0 ? 0 : (z.freeFrom && sub>=z.freeFrom ? 0 : z.fee);
  return {sub, n, disc, fee, total: sub-disc+fee, left: Math.max(0, z.min-sub), z};
}

/* ---------- brand ---------- */
$$('[data-brand]').forEach(el=>el.textContent=BRAND);
$$('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
document.title = `${BRAND} — суши-кухня юго-запада (прототип)`;

/* ---------- cards ---------- */
function ctrl(p){
  const q=S.cart[p.id]||0;
  if(!q) return `<button class="add" data-add="${p.id}" aria-label="В корзину">+<span class="add__txt">&nbsp;${p.price?'В корзину':'Добавить'}</span></button>`;
  return `<div class="qty"><button data-dec="${p.id}" aria-label="Меньше">−</button><span>${q}</span><button data-inc="${p.id}" aria-label="Больше">+</button></div>`;
}
function card(p){
  return `<article class="card" data-open="${p.id}">
    <div class="card__img"><img src="img/${p.img}.webp" alt="${esc(p.name)}" loading="lazy">
      <div class="card__badges">${p.hit?'<span class="tag tag--hit">Хит</span>':''}${p.price===0?'<span class="tag" style="color:#3ddc97">Бесплатно</span>':''}</div></div>
    <div class="card__body">
      <div class="card__title">${esc(p.name)}</div>
      <div class="card__meta">${weight(p)}</div>
      <div class="card__desc">${esc(p.desc)}</div>
      <div class="card__foot"><div class="price">${p.price?rub(p.price):'0 ₽'}${perKg(p)?`<small>${perKg(p)}</small>`:''}</div><span data-ctrl="${p.id}">${ctrl(p)}</span></div>
    </div></article>`;
}
let curCat = CATS[0];
function renderTabs(){
  $('#tabs').innerHTML = CATS.map(c=>`<button class="tab" role="tab" aria-selected="${c===curCat}" data-cat="${c}">${c}</button>`).join('');
}
function renderGrid(){ $('#grid').innerHTML = P.filter(p=>p.cat===curCat).map(card).join(''); }
function renderPopular(){ $('#popularRail').innerHTML = P.filter(p=>p.hit).map(card).join(''); }
function refreshCtrls(){ $$('[data-ctrl]').forEach(el=>{ el.innerHTML = ctrl(byId(el.dataset.ctrl)); }); }

/* ---------- zones ---------- */
function renderZones(){
  $('#zonesTable').innerHTML = `<div class="zones__head"><span>Зона</span><span>Минимальный заказ</span><span>Доставка</span><span>Время</span></div>` +
    ZONES.map(z=>`<div class="zone ${z.near?'zone--near':''}">
      <div class="zone__name">${z.name}${z.near?'<span class="tag" style="color:#3ddc97;background:#3ddc9718">гарантия 40 мин</span>':''}</div>
      <div class="zone__time">${z.time}</div>
      <div class="zone__meta"><span class="m-only">Мин. заказ: </span>от ${rub(z.min)}</div>
      <div class="zone__meta"><span class="m-only">Доставка: </span>${z.fee? `${rub(z.fee)}, бесплатно от ${rub(z.freeFrom)}` : 'бесплатно'}</div>
    </div>`).join('');
  // desktop order: name, min, fee, time
  if (matchMedia('(min-width:720px)').matches){
    $$('.zone').forEach(r=>{ const t=r.querySelector('.zone__time'); r.appendChild(t); });
  }
  $('#zoneList').innerHTML = ZONES.map(z=>`<button class="zone-opt" data-zone="${z.id}" aria-pressed="${z.id===S.zone}">
      <span><b>${z.name}</b><small>от ${rub(z.min)} · ${z.fee?`доставка ${rub(z.fee)}`:'доставка бесплатно'}</small></span><b style="color:var(--accent2)">${z.time}</b></button>`).join('') +
      `<p class="note" style="margin-top:8px">Значения — пример, уточнить.</p>`;
  $('#zoneChipText').textContent = `${zone().name.split(',')[0]} · ${zone().time}`;
}

/* ---------- cart ---------- */
function setQty(id, q){
  if(q<=0) delete S.cart[id]; else S.cart[id]=q;
  if(API && S.promo){ S.promo=''; S.promoDisc=0; toast('Корзина изменилась — примените промокод ещё раз'); }
  save(); refreshCtrls(); renderCartUI();
  if(!$('#cartDrawer').hidden && S.step==='cart') renderDrawer();
  if(!$('#productModal').hidden) { const pid=$('#productBody').dataset.id; if(pid) $('#pmCtrl').innerHTML=pmCtrl(byId(pid)); }
}
function renderCartUI(){
  const t=totals();
  $('#cartSum').textContent = rub(t.sub);
  const c=$('#cartCount'); c.hidden=!t.n; c.textContent=t.n;
  const bar=$('#cartBar'); bar.hidden=!t.n;
  $('#cartBarText').textContent = `Корзина · ${t.n} шт`;
  $('#cartBarSum').textContent = rub(t.sub);
}
function toast(msg){
  let el=$('.toast'); if(!el){ el=document.createElement('div'); el.className='toast'; document.body.appendChild(el); }
  el.textContent=msg; el.classList.add('show'); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),1600);
}

function renderDrawer(){
  const body=$('#drawerBody'), foot=$('#drawerFoot'), t=totals();
  if(S.step==='done') return;
  if(!t.n){
    $('#drawerTitle').textContent='Корзина';
    body.innerHTML=`<div class="empty"><b>Корзина пока пустая</b>Начните с сета из половинок — так можно попробовать всё.</div>`;
    foot.innerHTML=`<button class="btn btn--primary btn--block" data-close data-goto="#menu">Перейти в меню</button>`; return;
  }
  if(S.step==='cart'){
    $('#drawerTitle').textContent='Корзина';
    const hasRolls = Object.keys(S.cart).some(id=>!['Напитки','Соусы'].includes(byId(id).cat));
    body.innerHTML = Object.entries(S.cart).map(([id,q])=>{ const p=byId(id); return `
      <div class="line"><img src="img/${p.img}.webp" alt="">
        <div><div class="line__t">${esc(p.name)}</div><div class="line__m">${weight(p)} · ${rub(p.price)}</div></div>
        <div class="qty"><button data-dec="${id}">−</button><span>${q}</span><button data-inc="${id}">+</button></div></div>`}).join('') +
      (hasRolls?`<div class="freebie">🥢 Соевый соус, имбирь, васаби и приборы — бесплатно</div>`:'') +
      `<div class="box"><div class="box__t">Зона доставки</div>
        <select class="input" id="zoneSel">${ZONES.map(z=>`<option value="${z.id}" ${z.id===S.zone?'selected':''}>${z.name}</option>`).join('')}</select>
        <p class="muted small" style="margin-top:8px">Ожидаемое время: <b style="color:var(--text)">${t.z.time}</b>${t.z.near?' · действует гарантия 40 минут':''} <span class="tag tag--warn">пример</span></p></div>
      <div class="box"><div class="box__t">Промокод</div>
        <div class="row"><input class="input" id="promoIn" placeholder="Например, ANNINO10" value="${esc(S.promo)}" autocapitalize="characters"><button class="btn btn--ghost btn--sm" id="promoBtn">${S.promo?'Убрать':'Применить'}</button></div>
        ${S.promo?`<div class="promo-msg ok">✓ ${esc(API ? (S.promoLabel||('Скидка '+rub(S.promoDisc||0))) : PROMOS[S.promo].label)}</div>`:'<div class="promo-msg muted">У каждого ЖК и рекламного канала — свой промокод.</div>'}</div>`;
    foot.innerHTML = minbar(t) + sumBlock(t) +
      `<button class="btn btn--primary btn--block" id="toCheckout" ${t.left?'disabled':''} style="margin-top:12px">${t.left?`Добавьте ещё на ${rub(t.left)}`:`Оформить · ${rub(t.total)}`}</button>`;
  }
  if(S.step==='checkout'){
    $('#drawerTitle').textContent='Оформление';
    body.innerHTML = `
      <button class="muted small" id="backCart" style="margin:4px 0 8px">← Назад в корзину</button>
      <div class="box"><div class="box__t">Контакты</div>
        <div class="field"><label for="fName">Имя</label><input class="input" id="fName" autocomplete="name" placeholder="Как к вам обращаться"></div>
        <div class="field"><label for="fPhone">Телефон</label><input class="input" id="fPhone" type="tel" autocomplete="tel" placeholder="+7 ___ ___-__-__"></div></div>
      <div class="box"><div class="box__t">Адрес · ${t.z.name}</div>
        <div class="field"><label for="fAddr">Улица, дом</label><input class="input" id="fAddr" autocomplete="street-address" placeholder="Например, ул. Садовая, 1"></div>
        <div class="row"><input class="input" id="fApt" placeholder="Кв." aria-label="Квартира"><input class="input" id="fEnt" placeholder="Подъезд" aria-label="Подъезд"><input class="input" id="fFloor" placeholder="Этаж" aria-label="Этаж"></div></div>
      <div class="box"><div class="box__t">Когда</div>
        <div class="seg"><button data-when="asap" aria-pressed="${S.when==='asap'}">Как можно скорее<small>${t.z.time}</small></button><button data-when="later" aria-pressed="${S.when==='later'}">Ко времени<small>выбрать слот</small></button></div>
        ${S.when==='later'?`<select class="input" id="fSlot" style="margin-top:10px">${['18:00–18:30','18:30–19:00','19:00–19:30','19:30–20:00','20:00–20:30','00:00–00:30 (пт–сб, если подтвердит кухня)'].map(s=>`<option>${s}</option>`).join('')}</select>`:''}</div>
      <div class="box"><div class="box__t">Оплата</div>
        <div class="seg"><button data-pay="online" aria-pressed="${S.pay==='online'}">Онлайн: карта / СБП<small>заказ сразу уходит на кухню</small></button>${SERVER.cash?`<button data-pay="courier" aria-pressed="${S.pay==='courier'}">Курьеру<small>подтвердим в мессенджере</small></button>`:''}</div></div>
      <div class="box"><div class="box__t">Комментарий</div><textarea class="input" id="fComment" placeholder="Домофон, без лука, позвонить заранее…"></textarea></div>
      <p class="muted small" style="margin-top:12px">Нажимая кнопку, вы соглашаетесь с офертой и политикой обработки персональных данных.</p>`;
    foot.innerHTML = sumBlock(t) + `<button class="btn btn--primary btn--block" id="placeOrder" style="margin-top:12px">${S.pay==='online'?`Оплатить ${rub(t.total)}`:`Заказать · ${rub(t.total)}`}</button>
      ${API?'':'<p class="note" style="text-align:center;margin-top:8px">Прототип: реальной оплаты нет</p>'}`;
  }
}
function minbar(t){
  const pct=Math.min(100, Math.round(t.sub/t.z.min*100));
  return `<div class="minbar">${t.left?`До минимального заказа (${rub(t.z.min)}) не хватает <b style="color:var(--text)">${rub(t.left)}</b>`:`Минимальный заказ набран ✓`}<div class="minbar__track"><div class="minbar__fill" style="width:${pct}%"></div></div></div>`;
}
function sumBlock(t){
  return `<div class="sum"><div><span class="muted">Товары</span><span>${rub(t.sub)}</span></div>
    ${t.disc?`<div style="color:var(--ok)"><span>Промокод ${S.promo}</span><span>−${rub(t.disc)}</span></div>`:''}
    <div><span class="muted">Доставка</span><span>${t.fee?rub(t.fee):'бесплатно'}</span></div>
    <div class="total"><span>Итого</span><span>${rub(t.total)}</span></div></div>`;
}
function msgLinks(code){
  const txt = encodeURIComponent(`Заказ ${code}`), out=[];
  if(MSG.telegram){ const u=MSG.telegram; out.push(`<a class="btn btn--ghost btn--block" target="_blank" rel="noopener" href="${esc(/_bot\/?$/i.test(u)?u.replace(/\/$/,'')+'?start='+code:u)}">Telegram</a>`); }
  if(MSG.whatsapp) out.push(`<a class="btn btn--ghost btn--block" target="_blank" rel="noopener" href="https://wa.me/${esc(MSG.whatsapp)}?text=${txt}">WhatsApp</a>`);
  if(MSG.max) out.push(`<a class="btn btn--ghost btn--block" target="_blank" rel="noopener" href="${esc(MSG.max)}">Max</a>`);
  return `<div class="box" style="text-align:left"><div class="box__t">Номер заказа: <b style="color:var(--accent2)">${code}</b>
    <button class="btn btn--ghost btn--sm" data-copy="${code}" style="margin-left:6px">Скопировать</button></div>
    <div style="display:grid;gap:8px;margin-top:10px">${out.join('')||'<p class="muted small">Мессенджеры подключим после запуска.</p>'}</div></div>`;
}
function showResult(code, st){
  S.step='done';
  const paid = ['НОВЫЙ','ГОТОВИТСЯ','ГОТОВ','У КУРЬЕРА','ДОСТАВЛЕН'].includes(st.status);
  const cash = st.status==='НАЛИЧНЫЕ: ПОДТВЕРДИТЬ', wait = st.status==='ОЖИДАЕТ ОПЛАТЫ', bad = st.status==='ОТМЕНЁН';
  $('#drawerTitle').textContent = paid?'Заказ принят':(cash?'Подтвердите заказ':(wait?'Проверяем оплату':'Заказ не оформлен'));
  $('#drawerBody').innerHTML = `<div class="success"><div class="success__icon">${bad?'!':'✓'}</div>
    <h3>${paid?`Заказ ${code} уже на кухне`:cash?`Заказ ${code} ждёт подтверждения`:wait?'Ждём ответ банка…':'Оплата не прошла'}</h3>
    <p class="muted">${paid?`Оплачено ${rub(st.total)}${st.demo?' (демо)':''}. Статус меняется автоматически.`:
      cash?'Нажмите кнопку мессенджера ниже и отправьте номер заказа — сразу после этого кухня начнёт готовить. Оплата курьеру.':
      wait?'Обычно это несколько секунд. Не закрывайте страницу.':'Деньги не списаны. Можно попробовать ещё раз.'}</p>
    ${paid||cash?msgLinks(code):''}</div>`;
  $('#drawerFoot').innerHTML = bad?`<button class="btn btn--primary btn--block" id="retryOrder">Вернуться в корзину</button>`
                                  :`<button class="btn btn--primary btn--block" id="newOrder">Вернуться в меню</button>`;
  if(paid||cash){ S.cart={}; S.promo=''; S.promoDisc=0; save(); refreshCtrls(); renderCartUI(); }
}
async function pollStatus(code, tries=0){
  try{ const st=await apiGet({action:'status', code}); if(!st.ok){ toast(st.error); return; }
    showResult(code, st);
    if(st.status==='ОЖИДАЕТ ОПЛАТЫ' && tries<40) setTimeout(()=>pollStatus(code,tries+1), 3000);
  }catch(e){ if(tries<40) setTimeout(()=>pollStatus(code,tries+1), 4000); }
}
async function placeOrder(){
  if(!API) return placeOrderProto();
  const req=['#fName','#fPhone','#fAddr']; let ok=true;
  req.forEach(s=>{ const el=$(s); const bad=!el.value.trim(); el.classList.toggle('err',bad); if(bad) ok=false; });
  if(!ok){ toast('Заполните имя, телефон и адрес'); return; }
  const btn=$('#placeOrder'); if(btn.disabled) return; btn.disabled=true; btn.textContent='Отправляем…';
  const v=id=>($(id)||{}).value||'';
  const body={ items:Object.entries(S.cart).map(([id,qty])=>({id,qty})), zone:S.zone, promo:S.promo,
    pay: S.pay==='online'?'online':'cash', name:v('#fName'), phone:v('#fPhone'), address:v('#fAddr'),
    apt:v('#fApt'), entrance:v('#fEnt'), floor:v('#fFloor'), when: S.when==='later'?v('#fSlot'):'как можно скорее',
    comment:v('#fComment'), source:source() };
  try{
    const r=await api('create', body);
    if(!r.ok){ toast(r.error||'Не получилось оформить'); btn.disabled=false; renderDrawer(); return; }
    if(r.payUrl){ try{ sessionStorage.setItem('sosed_last', r.code); }catch(e){} location.href=r.payUrl; return; }
    showResult(r.code, r);
  }catch(e){ toast('Нет связи с сервером — проверьте интернет'); btn.disabled=false; btn.textContent='Повторить'; }
}
function placeOrderProto(){
  const req=['#fName','#fPhone','#fAddr']; let ok=true;
  req.forEach(s=>{ const el=$(s); const bad=!el.value.trim(); el.classList.toggle('err',bad); if(bad) ok=false; });
  if(!ok){ toast('Заполните имя, телефон и адрес'); return; }
  const t=totals(), num = Math.floor(1000+Math.random()*9000), online = S.pay==='online';
  S.step='done';
  $('#drawerTitle').textContent='Готово';
  $('#drawerBody').innerHTML = `<div class="success"><div class="success__icon">✓</div>
    <h3>Заказ №${num} принят</h3>
    <p class="muted">${online?'Оплата прошла (демо). Кухня уже видит заказ.':'Менеджер позвонит в течение пары минут, чтобы подтвердить заказ.'}<br>Привезём за ${t.z.time}.</p>
    <ol class="cycle">
      ${online?`<li class="on"><b>Оплачено онлайн</b>Карта или СБП на сайте</li>
      <li class="on"><b>Сразу на экран кухни</b>Без звонка менеджера</li>`:
      `<li class="on"><b>Заказ получен</b>Оплата курьеру при получении</li>
      <li><b>Менеджер подтверждает</b>Короткий звонок, затем заказ уходит на кухню</li>`}
      <li><b>Готовим</b>Повар отмечает «готово» на кухонном экране</li>
      <li><b>Курьер в пути</b>Придёт SMS со статусом</li>
      <li><b>У вас</b>${t.z.near?'Опоздали больше 40 минут — ролл в подарок в следующий заказ':'Приятного аппетита!'}</li>
    </ol>
    <p class="note">Прототип: заказ никуда не отправлен. В рабочей версии этот путь настроит платформа (Smartomato).</p></div>`;
  $('#drawerFoot').innerHTML = `<button class="btn btn--primary btn--block" id="newOrder">Вернуться в меню</button>`;
  S.cart={}; S.promo=''; save(); refreshCtrls(); renderCartUI();
}

/* ---------- product modal ---------- */
function pmCtrl(p){
  const q=S.cart[p.id]||0;
  return q ? `<div class="qty" style="height:52px;padding:0 8px"><button data-dec="${p.id}">−</button><span>${q} в корзине</span><button data-inc="${p.id}">+</button></div>`
           : `<button class="btn btn--primary" data-add="${p.id}" style="flex:1">В корзину · ${rub(p.price)}</button>`;
}
function openProduct(id){
  const p=byId(id), b=$('#productBody'); b.dataset.id=id;
  b.innerHTML = `<div class="pm__img"><img src="img/${p.img}.webp" alt="${esc(p.name)}"></div>
    <div class="pm__body"><div>${p.hit?'<span class="tag tag--hit">Хит</span> ':''}<span class="tag">${p.cat}</span></div>
      <h3>${esc(p.name)}</h3><div class="muted">${weight(p)}</div>
      <p class="pm__desc">${esc(p.desc)}</p>
      <div class="pm__facts">${p.g?`<div><b>${p.g} г</b>вес</div>`:''}${p.ml?`<div><b>${p.ml} мл</b>объём</div>`:''}${p.pcs?`<div><b>${p.pcs} шт</b>кусочков</div>`:''}${perKg(p)?`<div><b>${perKg(p)}</b>цена за кг</div>`:''}</div>
      <p class="small muted"><b style="color:var(--text)">Состав:</b> ${esc(p.comp)}</p>
      <div style="display:flex;gap:10px;align-items:center;margin-top:auto;padding-top:22px" id="pmCtrl">${pmCtrl(p)}</div>
      <p class="pm__note">Цена, вес и состав — пример, финальные даст кухня. Фото сгенерировано для макета.</p></div>`;
  openLayer('#productModal');
}

/* ---------- layers ---------- */
function openLayer(sel){ $(sel).hidden=false; document.body.style.overflow='hidden'; }
function closeLayer(el){ el.hidden=true; if(!$$('.modal,.drawer').some(m=>!m.hidden)) document.body.style.overflow=''; }
function openCart(){ if(S.step==='done') S.step='cart'; renderDrawer(); openLayer('#cartDrawer'); }

/* ---------- events ---------- */
document.addEventListener('click', e=>{
  const t=e.target.closest('[data-add],[data-inc],[data-dec],[data-cat],[data-zone],[data-close],[data-open],[data-open-zone],[data-pay],[data-when],#cartBtn,#cartBar,#zoneChip,#toCheckout,#backCart,#placeOrder,#newOrder,#promoBtn,#retryOrder,[data-copy]');
  if(!t) return;
  const d=t.dataset;
  if(d.add){ e.stopPropagation(); setQty(d.add,(S.cart[d.add]||0)+1); toast('Добавлено в корзину'); return; }
  if(d.inc){ e.stopPropagation(); setQty(d.inc,(S.cart[d.inc]||0)+1); return; }
  if(d.dec){ e.stopPropagation(); setQty(d.dec,(S.cart[d.dec]||0)-1); return; }
  if(d.cat){ curCat=d.cat; renderTabs(); renderGrid(); t.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'}); return; }
  if(d.zone){ S.zone=d.zone; save(); renderZones(); renderCartUI(); closeLayer($('#zoneModal')); toast('Зона: '+zone().name); return; }
  if(d.pay){ S.pay=d.pay; save(); keepForm(()=>renderDrawer()); return; }
  if(d.when){ S.when=d.when; save(); keepForm(()=>renderDrawer()); return; }
  if('close' in d){ closeLayer(t.closest('.modal,.drawer')); if(d.goto) location.hash=d.goto; return; }
  if(d.open){ openProduct(d.open); return; }
  if('openZone' in d || t.id==='zoneChip'){ openLayer('#zoneModal'); return; }
  if(t.id==='cartBtn'||t.id==='cartBar'){ openCart(); return; }
  if(t.id==='toCheckout'){ S.step='checkout'; renderDrawer(); $('#drawerBody').scrollTop=0; return; }
  if(t.id==='backCart'){ S.step='cart'; renderDrawer(); return; }
  if(t.id==='placeOrder'){ placeOrder(); return; }
  if(d.copy){ try{ navigator.clipboard.writeText(d.copy); toast('Номер скопирован'); }catch(err){ toast(d.copy); } return; }
  if(t.id==='retryOrder'){ S.step='cart'; renderDrawer(); return; }
  if(t.id==='newOrder'){ S.step='cart'; closeLayer($('#cartDrawer')); location.hash='#menu'; return; }
  if(t.id==='promoBtn'){
    if(S.promo){ S.promo=''; S.promoDisc=0; save(); renderDrawer(); return; }
    const code=$('#promoIn').value.trim().toUpperCase();
    if(API){ if(!code) return; api('promo',{promo:code, sub:totals().sub}).then(r=>{
        if(r.ok){ S.promo=r.code; S.promoDisc=r.disc; S.promoLabel=r.label||''; save(); renderDrawer(); toast('Промокод применён'); }
        else { renderDrawer(); $('#promoIn').value=code; $('.promo-msg').className='promo-msg bad'; $('.promo-msg').textContent=r.error; }
      }).catch(()=>toast('Нет связи с сервером')); return; }
    if(PROMOS[code]){ S.promo=code; save(); renderDrawer(); toast('Промокод применён'); }
    else { renderDrawer(); $('#promoIn').value=code; $('.promo-msg').className='promo-msg bad'; $('.promo-msg').textContent='Такого промокода нет. Попробуйте ANNINO10'; }
  }
});
document.addEventListener('change', e=>{ if(e.target.id==='zoneSel'){ S.zone=e.target.value; save(); renderZones(); renderDrawer(); renderCartUI(); }});
document.addEventListener('keydown', e=>{ if(e.key==='Escape') $$('.modal,.drawer').filter(m=>!m.hidden).forEach(closeLayer); });
function keepForm(fn){ const v={}; $$('#drawerBody input,#drawerBody textarea').forEach((el,i)=>v[el.id||i]=el.value); fn(); $$('#drawerBody input,#drawerBody textarea').forEach((el,i)=>{ if(v[el.id||i]!==undefined) el.value=v[el.id||i]; }); }

/* ---------- init ---------- */
renderTabs(); renderGrid(); renderPopular(); renderZones(); renderCartUI();
// deep links for demos/screenshots: #cart, #checkout
if(location.hash==='#cart') openCart();
if(API){ loadServerMenu();
  const oc=new URLSearchParams(location.search).get('order');
  if(oc){ openLayer('#cartDrawer'); $('#drawerTitle').textContent='Проверяем оплату'; $('#drawerBody').innerHTML='<div class="empty">Секунду…</div>'; $('#drawerFoot').innerHTML=''; pollStatus(oc.toUpperCase()); }
}
