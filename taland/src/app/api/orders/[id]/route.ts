import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/http";
import { markOrderPaid, orderPublic } from "@/lib/orders";
import { fetchYookassaPayment } from "@/lib/yookassa";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  let order = await prisma.order.findUnique({ where: { id }, include: { lines: true } });
  if (!order) return fail("Заказ не найден", 404);
  if (order.paymentMethod === "online" && order.paymentStatus !== "paid" && order.yookassaId && order.status !== "cancelled") {
    const remote = await fetchYookassaPayment(order.yookassaId);
if (remote?.status === "succeeded" && remote.paid) {
    const updated = await markOrderPaid(order.id);
    if (updated) order = updated;
  } else if (remote?.status === "canceled" && order) {
      order = await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "failed" },
        include: { lines: true },
      });
    }
  }
  if (!order) return fail("Заказ не найден", 404);
  return ok({ order: orderPublic(order) });
}
