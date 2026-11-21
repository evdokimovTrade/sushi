import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/http";
import { markOrderPaid, orderPublic } from "@/lib/orders";
import { paymentMode } from "@/lib/yookassa";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (paymentMode() !== "mock") return fail("Тестовое подтверждение выключено", 404);
  const body = (await request.json().catch(() => null)) as { orderId?: string } | null;
  const order = await prisma.order.findUnique({ where: { id: body?.orderId || "" }, include: { lines: true } });
  if (!order) return fail("Заказ не найден", 404);
  if (order.paymentMethod !== "online") return fail("Этот заказ без онлайн-оплаты");
  if (order.status === "cancelled") return fail("Заказ отменён");
  if (order.paymentMode !== "mock") return fail("Заказ создан не в тестовом контуре");
  const fresh = await markOrderPaid(order.id);
  if (!fresh) return fail("Заказ не найден", 404);
  return ok({ order: orderPublic(fresh) });
}
