import { allocateDiscountKopecks } from "./pricing";

export type ReceiptItem = {
  description: string;
  quantity: string;
  amount: { value: string; currency: "RUB" };
  vat_code: number;
  payment_mode: string;
  payment_subject: "commodity" | "service";
  measure: "piece";
};

export type ReceiptInputLine = { name: string; qty: number; sum: number };

function kopToValue(kop: number) {
  return (kop / 100).toFixed(2);
}

/**
 * amount в чеке ЮKassa — цена за единицу.
 * Итог чека = сумма quantity × amount и должен совпасть с суммой платежа.
 * Скидка раскладывается по позициям. Если цена не делится на количество, позиция дробится.
 */
export function buildReceiptItems(input: {
  lines: ReceiptInputLine[];
  discount: number;
  deliveryFee: number;
  vatCode: number;
  paymentMode: string;
}) {
  const amounts = allocateDiscountKopecks(
    input.lines.map((l) => l.sum),
    input.discount,
  );
  const items: ReceiptItem[] = [];

  input.lines.forEach((line, index) => {
    const totalKop = amounts[index];
    if (totalKop <= 0 || line.qty <= 0) return;
    const qty = line.qty;
    const base = Math.floor(totalKop / qty);
    const rem = totalKop - base * qty;
    const push = (quantity: number, unitKop: number) => {
      if (quantity <= 0 || unitKop <= 0) return;
      items.push({
        description: line.name.slice(0, 128),
        quantity: quantity.toFixed(3),
        amount: { value: kopToValue(unitKop), currency: "RUB" },
        vat_code: input.vatCode,
        payment_mode: input.paymentMode,
        payment_subject: "commodity",
        measure: "piece",
      });
    };
    if (rem === 0) push(qty, base);
    else {
      push(qty - 1, base);
      push(1, base + rem);
    }
  });

  const deliveryKop = Math.round(input.deliveryFee * 100);
  if (deliveryKop > 0) {
    items.push({
      description: "Доставка",
      quantity: "1.000",
      amount: { value: kopToValue(deliveryKop), currency: "RUB" },
      vat_code: input.vatCode,
      payment_mode: input.paymentMode,
      payment_subject: "service",
      measure: "piece",
    });
  }

  const totalKop = receiptTotalKopecks(items);
  const expected =
    input.lines.reduce((s, l) => s + Math.round(l.sum * 100), 0) -
    Math.round(input.discount * 100) +
    deliveryKop;
  if (totalKop !== expected) {
    throw new Error(`Чек не сходится: ${totalKop} ≠ ${expected}`);
  }
  if (items.some((item) => Number(item.amount.value) <= 0)) {
    throw new Error("В чеке есть нулевая сумма");
  }
  return { items, total: kopToValue(totalKop) };
}

export function receiptTotalKopecks(items: ReceiptItem[]) {
  return items.reduce((sum, item) => {
    const qty = Math.round(Number(item.quantity) * 1000);
    const unit = Math.round(Number(item.amount.value) * 100);
    return sum + Math.round((qty * unit) / 1000);
  }, 0);
}
