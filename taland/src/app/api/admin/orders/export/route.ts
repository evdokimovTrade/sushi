import { requireAdmin } from "@/lib/auth";
import { listOrders, orderFilters } from "@/lib/order-query";
import { csvEscape, formatSource, PAYMENT_LABEL, STATUS_LABEL } from "@/lib/statuses";
import { formatMoscow } from "@/lib/money";

export const dynamic = "force-dynamic";

/** Последнее касание с метками; если его нет — первое. Колонки для загрузки офлайн-конверсий в Метрику и VK. */
function attrCols(raw: string) {
  let a: Record<string, unknown> = {};
  try { a = JSON.parse(raw || "{}"); } catch { a = {}; }
  const t = ((a.last || a.first || {}) as Record<string, string>);
  return [t.utm_source, t.utm_medium, t.utm_campaign, t.utm_term, t.utm_content, t.yclid, t.gclid, t.rb_clickid || t.vk_click_id,
    String(a.ym_client_id || ""), t.landing, String(a.referrer || "")].map((v) => String(v || ""));
}

export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return new Response("Нужен вход в админку", { status: 401 });
  }
  const orders = await listOrders(orderFilters(new URL(request.url)));
  const header = ["дата", "№", "источник", "промокод", "позиции", "сумма", "оплата", "статус",
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "yclid", "gclid", "vk_click", "ym_client_id", "страница входа", "реферер", "телефон"];
  const rows = orders.map((order) => {
    const positions = order.lines
      .map((line) => {
        const name = line.variantName ? `${line.itemName}, ${line.variantName}` : line.itemName;
        return `${name} × ${line.qty}`;
      })
      .join(" | ");
    return [
      formatMoscow(order.createdAt),
      order.number,
      formatSource(order.utmSource, order.utmCampaign),
      order.promoCode,
      positions,
      String(order.total),
      PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod,
      STATUS_LABEL[order.status] || order.status,
      ...attrCols(order.attribution),
      order.phone,
    ].map(csvEscape).join(";");
  });
  const csv = "\uFEFF" + header.join(";") + "\n" + rows.join("\n") + "\n";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"taland-orders.csv\"",
    },
  });
}
