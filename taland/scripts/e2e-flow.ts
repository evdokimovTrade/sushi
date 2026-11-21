const base = process.env.BASE_URL || "http://127.0.0.1:3000";

function assert(cond: unknown, message: string) {
  if (!cond) throw new Error(message);
}

function jar() {
  const cookies = new Map<string, string>();
  return async function api(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    if (cookies.size) {
      headers.set("cookie", [...cookies.entries()].map(([key, value]) => `${key}=${value}`).join("; "));
    }
    const res = await fetch(base + path, { ...init, headers });
    const list = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    for (const line of list) {
      const pair = line.split(";")[0];
      const index = pair.indexOf("=");
      cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const text = buf.toString("utf8");
    let json: Record<string, unknown> | null = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
    return { status: res.status, json, text, buf };
  };
}

async function main() {
  const health = await fetch(base + "/api/health");
  const healthJson = await health.json();
  assert(healthJson.ok && healthJson.items >= 20, "Меню не засеяно");
  assert(healthJson.payment === "mock", "Без ключей оплата должна быть тестовой");

  const menuRes = await fetch(base + "/api/menu");
  const menu = await menuRes.json();
  const sushi = menu.categories.find((category: { id: string }) => category.id === "sushi");
  const grill = menu.categories.find((category: { id: string }) => category.id === "grill");
  const burgers = menu.categories.find((category: { id: string }) => category.id === "burgers");
  assert(sushi.items.length <= 10 && sushi.items.length === 5, "Суши");
  assert(sushi.items.every((item: { variants: unknown[] }) => item.variants.length === 3), "У суши 3 варианта");
  assert(burgers.items.length === 3 && burgers.items.every((item: { variants: unknown[] }) => item.variants.length === 3), "3 бургера");
  const pork = grill.items.find((item: { id: string }) => item.id === "shashlyk-pork");
  assert(pork.variants.find((variant: { name: string }) => variant.name === "Шея").price === 600, "Цена шеи");
  const tea = grill.items.find((item: { id: string }) => item.id === "tea");
  assert(tea.qtyOnly && tea.variants.length === 1 && tea.variants[0].price === 60, "Чай только количеством");

  const phila = sushi.items[0].variants[0].id;
  const shaverma = grill.items.find((item: { id: string }) => item.id === "shaverma").variants[0].id;
  const guest = jar();

  const tooSmall = await guest("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lines: [{ itemId: "tea", variantId: tea.variants[0].id, qty: 1 }],
      name: "Тест",
      phone: "+7 999 000-11-22",
      address: "улица Тестовая, дом 1",
      zoneId: "annino",
      paymentMethod: "on_delivery",
    }),
  });
  assert(tooSmall.status === 400, "Маленький заказ должен не пройти минимум");

  const cod = await guest("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lines: [
        { itemId: "phila", variantId: phila, qty: 1 },
        { itemId: "shaverma", variantId: shaverma, qty: 1 },
      ],
      name: "Тест",
      phone: "+7 999 000-11-22",
      address: "улица Тестовая, дом 1",
      comment: "домофон 1",
      promo: "taland10",
      zoneId: "gorelovo",
      paymentMethod: "on_delivery",
      utmSource: "qr_auto",
      utmCampaign: "banner",
    }),
  });
  assert(cod.status === 200, "Заказ при получении: " + JSON.stringify(cod.json));
  const codOrder = cod.json.order as { id: string; status: string; total: number; promoCode: string; utmSource: string; discount: number; deliveryFee: number };
  assert(codOrder.status === "awaiting_confirmation", "Статус ожидает менеджера, а не " + codOrder.status);
  assert(codOrder.promoCode === "TALAND10" && codOrder.discount === 101, "Промокод 10%");
  assert(codOrder.deliveryFee === 200 && codOrder.total === 1118, "Итог 1118, получили " + codOrder.total);
  assert(codOrder.utmSource === "qr_auto", "utm");

  const online = await guest("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lines: [
        { itemId: "phila", variantId: phila, qty: 1 },
        { itemId: "shaverma", variantId: shaverma, qty: 1 },
      ],
      name: "Тест",
      phone: "+7 999 000-11-22",
      address: "улица Тестовая, дом 1",
      promo: "TALAND10",
      zoneId: "gorelovo",
      paymentMethod: "online",
      utmSource: "2gis",
      utmCampaign: "card",
    }),
  });
  assert(online.status === 200, "Онлайн-заказ");
  const onlineOrder = online.json.order as { id: string; status: string; paymentMode: string };
  assert(onlineOrder.status === "awaiting_payment" && onlineOrder.paymentMode === "mock", "Ждёт тестовую оплату");

  const paid = await guest("/api/payments/mock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: onlineOrder.id }),
  });
  assert(paid.status === 200, "Тестовая оплата");
  const paidOrder = paid.json.order as { status: string; paymentStatus: string };
  assert(paidOrder.status === "kitchen" && paidOrder.paymentStatus === "paid", "После оплаты заказ на кухне");

  const admin = jar();
  const denied = await admin("/api/admin/orders");
  assert(denied.status === 401, "Админка закрыта");
  const login = await admin("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "change-me" }),
  });
  assert(login.status === 200, "Вход админа");
  const list = await admin("/api/admin/orders");
  const orders = (list.json.orders as { status: string; utmSource: string; promoCode: string }[]);
  assert(orders.some((order) => order.status === "awaiting_confirmation" && order.utmSource === "qr_auto" && order.promoCode === "TALAND10"), "В списке заказ при получении");
  assert(orders.some((order) => order.status === "kitchen" && order.utmSource === "2gis"), "В списке оплаченный заказ");

  const csv = await admin("/api/admin/orders/export");
  assert(csv.buf[0] === 0xef && csv.buf[1] === 0xbb && csv.buf[2] === 0xbf, "BOM");
  const header = csv.text.replace(/^\uFEFF/, "").split("\n")[0].trim();
  assert(header === "дата;№;источник;промокод;позиции;сумма;оплата;статус", "Колонки CSV: " + header);
  assert(csv.text.includes("qr_auto / banner"), "Источник в CSV");
  assert(csv.text.includes("При получении"), "Оплата в CSV");
  assert(csv.text.includes("Ожидает подтверждения менеджера"), "Статус в CSV");

  const kitchenId = (list.json.orders as { id: string; status: string }[]).find((order) => order.status === "kitchen")!.id;
  const bad = await admin(`/api/admin/orders/${kitchenId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "delivered" }),
  });
  assert(bad.status === 400, "Нельзя перескочить статус");
  const ready = await admin(`/api/admin/orders/${kitchenId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "ready" }),
  });
  assert(ready.status === 200 && (ready.json.order as { status: string }).status === "ready", "Готово");

  const otp = await guest("/api/auth/otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "79990001122" }),
  });
  assert(otp.status === 200 && typeof otp.json.devCode === "string", "Тестовый код");
  const verify = await guest("/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+7 999 000-11-22", code: otp.json.devCode }),
  });
  assert(verify.status === 200, "Вход клиента");
  const history = await guest("/api/account/orders");
  const historyOrders = history.json.orders as { id: string }[];
  assert(historyOrders.length >= 2, "В кабинете оба заказа");

  const rules = await admin("/api/admin/menu/phila", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      variants: [
        { name: "Лосось", price: 619 },
        { name: "Тунец", price: 649 },
      ],
    }),
  });
  assert(rules.status === 400, "Нельзя оставить у суши 2 варианта");

  console.log("e2e ok", { cod: codOrder.total, kitchen: "paid→kitchen→ready", history: historyOrders.length });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
