import { requireAdmin } from "@/lib/auth";
import { listOrders, orderFilters } from "@/lib/order-query";
import { csvEscape, formatSource, PAYMENT_LABEL, STATUS_LABEL } from "@/lib/statuses";
import { formatMoscow } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return new Response("Нужен вход в админку", { status: 401 });
  }
  const orders = await listOrders(orderFilters(new URL(request.url)));
  const header = ["дата", "№", "источник", "промокод", "позиции", "сумма", "оплата", "статус"];
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
