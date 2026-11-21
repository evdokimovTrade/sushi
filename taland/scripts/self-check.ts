import { MENU, assertMenuRules } from "../prisma/menu-data";
import { buildReceiptItems, receiptTotalKopecks } from "../src/lib/receipt";
import { calcDiscount } from "../src/lib/pricing";
import { normalizePhone } from "../src/lib/phone";
import { menuRuleError } from "../src/lib/menu-rules";

assertMenuRules();

const sushi = MENU.filter((item) => item.cat === "sushi");
const burgers = MENU.filter((item) => item.cat === "burgers");
if (sushi.length !== 5) throw new Error("В прототипе 5 суши");
if (burgers.length !== 3) throw new Error("Бургеров должно быть 3");
if (MENU.find((item) => item.id === "shaverma")?.variants.find((variant) => variant.id === "pork")?.price !== 400) {
  throw new Error("Цена шавермы из свинины");
}
if (MENU.find((item) => item.id === "shashlyk-pork")?.variants.find((variant) => variant.id === "neck")?.price !== 600) {
  throw new Error("Цена шеи");
}
if (MENU.find((item) => item.id === "phila")?.variants[0].price !== 619) throw new Error("Филадельфия");

if (menuRuleError("sushi", false, 2)) {
  // ожидаемая ошибка
} else throw new Error("Правило 3 вариантов не сработало");
if (menuRuleError("burgers", false, 3) !== null) throw new Error("3 варианта бургера допустимы");
if (menuRuleError("grill", true, 1) !== null) throw new Error("Соус — одна цена");

const promo = calcDiscount(1019, { type: "percent", value: 10, minOrder: 0 });
if (promo.discount !== 101) throw new Error("10% от 1019 = 101, получили " + promo.discount);

if (normalizePhone("+7 (999) 000-11-22") !== "79990001122") throw new Error("Телефон");
if (normalizePhone("89990001122") !== "79990001122") throw new Error("Восьмёрка");

const receipt = buildReceiptItems({
  lines: [
    { name: "Филадельфия, Лосось", qty: 1, sum: 619 },
    { name: "Шаверма, Из свинины", qty: 2, sum: 800 },
  ],
  discount: 101,
  deliveryFee: 200,
  vatCode: 1,
  paymentMode: "full_prepayment",
});
const kop = receiptTotalKopecks(receipt.items);
const expected = (619 + 800 - 101 + 200) * 100;
if (kop !== expected) throw new Error(`Чек ${kop} ≠ ${expected}`);
if (receipt.total !== (expected / 100).toFixed(2)) throw new Error("Строка суммы чека");
if (receipt.items.some((item) => Number(item.amount.value) <= 0)) throw new Error("Нулевая цена в чеке");

console.log("self-check ok", receipt.total);
