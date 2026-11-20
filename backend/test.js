// Проверка расчёта заказа и чека: node backend/test.js
const fs=require('fs'), vm=require('vm'), assert=require('assert');
const ctx={module:{exports:{}}}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(__dirname+'/Code.gs','utf8'),ctx);
const {calcOrder,promoApply,receiptItems,normPhone}=ctx.module.exports;
const menu=[{id:'a',name:'Филадельфия',price:619,available:true},{id:'b',name:'Сет',price:1590,available:true},
 {id:'s',name:'Соусы',price:0,available:true},{id:'x',name:'Нет',price:100,available:false}];
const zones=[{id:'z1',name:'Аннино',min:700,fee:0,freeFrom:0,minutes:40},{id:'z2',name:'Горелово',min:900,fee:200,freeFrom:2000,minutes:75}];
const promos=[{code:'P10',type:'%',value:10,active:true,min:0,limit:0,used:0},{code:'R300',type:'₽',value:300,active:true,min:1000,limit:1,used:0},
 {code:'OLD',type:'%',value:10,active:true,until:new Date('2026-01-01'),limit:0,used:0},{code:'USED',type:'%',value:5,active:true,limit:2,used:2}];
const now=new Date('2026-11-20T12:00:00Z'); let n=0; const ok=(c,m)=>{assert(c,m);n++;};
const sumK=items=>items.reduce((a,i)=>a+Math.round(Number(i.amount.value)*100)*Number(i.quantity),0);
// базовый
let c=calcOrder({items:[{id:'a',qty:2}],zone:'z1'},menu,zones,promos,now); ok(c.ok&&c.total===1238,'base');
// минимум
c=calcOrder({items:[{id:'a',qty:1}],zone:'z1'},menu,zones,promos,now); ok(!c.ok&&/Минимальный/.test(c.error),'min');
// доставка платная и бесплатная от
c=calcOrder({items:[{id:'a',qty:2}],zone:'z2'},menu,zones,promos,now); ok(c.ok&&c.fee===200&&c.total===1438,'fee');
c=calcOrder({items:[{id:'b',qty:2}],zone:'z2'},menu,zones,promos,now); ok(c.ok&&c.fee===0,'free from');
// нет в наличии, чужой id, плохое кол-во, только бесплатное
ok(!calcOrder({items:[{id:'x',qty:1},{id:'b',qty:1}],zone:'z1'},menu,zones,promos,now).ok,'stock');
ok(!calcOrder({items:[{id:'zzz',qty:1}],zone:'z1'},menu,zones,promos,now).ok,'unknown');
ok(!calcOrder({items:[{id:'b',qty:0}],zone:'z1'},menu,zones,promos,now).ok,'qty0');
ok(!calcOrder({items:[{id:'b',qty:999}],zone:'z1'},menu,zones,promos,now).ok,'qty big');
ok(!calcOrder({items:[{id:'s',qty:3}],zone:'z1'},menu,zones,promos,now).ok,'only free');
ok(!calcOrder({items:[{id:'b',qty:1}],zone:'nope'},menu,zones,promos,now).ok,'zone');
// цена из браузера игнорируется
c=calcOrder({items:[{id:'b',qty:1,price:1}],zone:'z1'},menu,zones,promos,now); ok(c.total===1590,'price from server');
// промокоды
ok(promoApply('p10',1000,promos,now).disc===100,'pct lower-case');
ok(!promoApply('R300',900,promos,now).ok,'promo min');
ok(promoApply('R300',1000,promos,now).disc===300,'fixed');
ok(!promoApply('OLD',1000,promos,now).ok,'expired');
ok(!promoApply('USED',1000,promos,now).ok,'limit');
ok(!calcOrder({items:[{id:'b',qty:1}],zone:'z1',promo:'NOPE'},menu,zones,promos,now).ok,'bad promo blocks');
// чек всегда равен сумме платежа — перебор
let checked=0;
for(let qa=0;qa<=7;qa++)for(let qb=0;qb<=3;qb++)for(const pr of ['','P10','R300'])for(const z of ['z1','z2']){
  const items=[]; if(qa)items.push({id:'a',qty:qa}); if(qb)items.push({id:'b',qty:qb}); items.push({id:'s',qty:1});
  const cc=calcOrder({items,zone:z,promo:pr},menu,zones,promos,now); if(!cc.ok) continue;
  const r=receiptItems(cc,1,'full_prepayment'); assert(r.every(i=>i.payment_mode==='full_prepayment')); assert.strictEqual(sumK(r),cc.total*100,JSON.stringify({qa,qb,pr,z}));
  r.forEach(i=>{assert(Number(i.amount.value)>0); assert(/^\d+\.\d{2}$/.test(i.amount.value));}); checked++;
}
ok(checked>50,'receipt sums '+checked);
// телефон
ok(normPhone('+7 (921) 123-45-67')==='79211234567','phone +7'); ok(normPhone('89211234567')==='79211234567','phone 8');
ok(normPhone('9211234567')==='79211234567','phone 10'); ok(normPhone('12345')==='','phone bad');
console.log('OK', n, 'проверок, чеков сверено:', checked);
