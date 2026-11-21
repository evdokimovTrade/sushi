export type PromoShape = { type: string; value: number; minOrder: number; active?: boolean; expiresAt?: string | null };

export function calcDiscount(subtotal: number, promo: PromoShape | null) {
  if (!promo || promo.active === false) return { discount: 0, error: promo ? "Промокод выключен" : null };
  if (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now()) {
    return { discount: 0, error: "Срок промокода истёк" };
  }
  if (subtotal < promo.minOrder) {
    return { discount: 0, error: `Промокод действует от ${promo.minOrder} ₽` };
  }
  if (promo.type === "percent") {
    const value = Math.min(100, Math.max(0, promo.value));
    return { discount: Math.floor((subtotal * value) / 100), error: null };
  }
  if (promo.type === "fixed") {
    return { discount: Math.min(Math.max(0, promo.value), subtotal), error: null };
  }
  return { discount: 0, error: "Неизвестный тип промокода" };
}

/** Суммы позиций после скидки, в копейках. Сумма равна subtotal*100 − discount*100. */
export function allocateDiscountKopecks(lineSumsRub: number[], discountRub: number) {
  const sums = lineSumsRub.map((n) => Math.round(n * 100));
  const sub = sums.reduce((s, n) => s + n, 0);
  const discount = Math.min(Math.max(0, Math.round(discountRub * 100)), sub);
  if (discount === 0) return sums;
  const cuts = sums.map((n) => Math.floor((discount * n) / sub));
  let rest = discount - cuts.reduce((s, n) => s + n, 0);
  for (let i = sums.length - 1; i >= 0 && rest > 0; i--) {
    const room = sums[i] - cuts[i];
    const add = Math.min(room, rest);
    cuts[i] += add;
    rest -= add;
  }
  return sums.map((n, i) => n - cuts[i]);
}
