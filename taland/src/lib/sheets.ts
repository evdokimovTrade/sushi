import { prisma } from "./prisma";
import { PAYMENT_LABEL, STATUS_LABEL } from "./statuses";

/**
 * Копия всего в Google Таблицу «ТаланД»: заказы (создание и каждая смена статуса) и события сайта.
 * Транспорт — веб-приложение Apps Script (sheets/Code.gs). Адрес и общий ключ — SHEETS_WEBHOOK_URL и SHEETS_SECRET.
 * Пока они не заданы, очередь копится в базе и уйдёт, когда адрес появится.
 */

const BATCH = 50;
const MAX_ATTEMPTS = 30;
let flushing = false;

function attr(raw: string) {
  try {
    const a = JSON.parse(raw || "{}");
    const t = a.last || a.first || {};
    return { ...t, referrer: a.referrer || "", ym_client_id: a.ym_client_id || "" } as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
}

/** Заказ целиком — таблица обновляет строку по номеру и ставит время текущего статуса. */
export async function enqueueOrder(orderId: string, event: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { lines: true } });
    if (!order) return;
    const a = attr(order.attribution);
    const payload = {
      event,
      changedAt: new Date().toISOString(),
      number: order.number,
      createdAt: order.createdAt.toISOString(),
      status: STATUS_LABEL[order.status] || order.status,
      payment: PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod,
      paid: order.paymentStatus === "paid",
      name: order.name,
      phone: order.phone,
      address: order.address,
      zone: order.zoneName,
      comment: order.comment,
      promo: order.promoCode,
      subtotal: order.subtotal,
      discount: order.discount,
      delivery: order.deliveryFee,
      total: order.total,
      utm_source: order.utmSource || a.utm_source || "",
      utm_medium: a.utm_medium || "",
      utm_campaign: order.utmCampaign || a.utm_campaign || "",
      utm_term: a.utm_term || "",
      yclid: a.yclid || "",
      vk_click: a.rb_clickid || a.vk_click_id || "",
      landing: a.landing || "",
      lines: order.lines.map((l) => ({ item: l.itemName, variant: l.variantName, qty: l.qty, price: l.price, sum: l.sum })),
    };
    await prisma.sheetOutbox.create({ data: { kind: "order", payload: JSON.stringify(payload) } });
    void flushOutbox();
  } catch (error) {
    console.error("sheets enqueueOrder", error);
  }
}

export async function enqueueEvents(events: unknown[]) {
  if (!events.length) return;
  await prisma.sheetOutbox.create({ data: { kind: "events", payload: JSON.stringify(events) } });
  void flushOutbox();
}

export async function flushOutbox() {
  const url = process.env.SHEETS_WEBHOOK_URL || "";
  const key = process.env.SHEETS_SECRET || "";
  if (!url || !key || flushing) return { sent: 0, skipped: true };
  flushing = true;
  let sent = 0;
  try {
    for (let round = 0; round < 10; round++) {
      const rows = await prisma.sheetOutbox.findMany({
        where: { sentAt: null, attempts: { lt: MAX_ATTEMPTS } },
        orderBy: { createdAt: "asc" },
        take: BATCH,
      });
      if (!rows.length) break;
      const items = rows.map((r) => ({ id: r.id, kind: r.kind, payload: JSON.parse(r.payload) }));
      let okIds: string[] = [];
      let error = "";
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ secret: key, items }),
          redirect: "follow",
          signal: AbortSignal.timeout(25000),
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; done?: string[]; error?: string };
        if (data.ok && Array.isArray(data.done)) okIds = data.done;
        else error = data.error || `HTTP ${res.status}`;
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }
      const done = new Set(okIds);
      if (done.size) await prisma.sheetOutbox.updateMany({ where: { id: { in: [...done] } }, data: { sentAt: new Date() } });
      const failed = rows.filter((r) => !done.has(r.id)).map((r) => r.id);
      sent += done.size;
      if (failed.length) {
        await prisma.sheetOutbox.updateMany({
          where: { id: { in: failed } },
          data: { attempts: { increment: 1 }, lastError: (error || "не подтверждено таблицей").slice(0, 300) },
        });
        break;
      }
    }
  } finally {
    flushing = false;
  }
  return { sent, skipped: false };
}

export async function outboxState() {
  const [pending, failed, last] = await Promise.all([
    prisma.sheetOutbox.count({ where: { sentAt: null, attempts: { lt: MAX_ATTEMPTS } } }),
    prisma.sheetOutbox.count({ where: { sentAt: null, attempts: { gte: MAX_ATTEMPTS } } }),
    prisma.sheetOutbox.findFirst({ where: { sentAt: { not: null } }, orderBy: { sentAt: "desc" } }),
  ]);
  return {
    pending,
    failed,
    lastSentAt: last?.sentAt?.toISOString() || null,
    configured: Boolean(process.env.SHEETS_WEBHOOK_URL && process.env.SHEETS_SECRET),
  };
}
