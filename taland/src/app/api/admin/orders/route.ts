import { fail, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { listOrders, orderFilters } from "@/lib/order-query";
import { orderPublic } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await requireAdmin())) return fail("Нужен вход в админку", 401);
  const orders = await listOrders(orderFilters(new URL(request.url)));
  return ok({ orders: orders.map(orderPublic) });
}
