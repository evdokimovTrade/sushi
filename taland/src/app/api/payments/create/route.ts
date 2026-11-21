import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/http";
import { createYookassaPayment, paymentMode } from "@/lib/yookassa";
import { markOrderPaid, orderPublic } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { orderId?: string } | null;
  const order = await prisma.order.findUnique({ where: { id: body?.orderId || "" }, include: { lines: true } });
  if (!order) return fail("Заказ не найден", 404);
  if (order.paymentMethod !== "online" || order.status === "cancelled") return fail("Оплата недоступна");
  if (order.paymentStatus === "paid") return ok({ order: orderPublic(order), confirmationUrl: "" });
  const mode = paymentMode();
  if (mode === "blocked") return fail("Онлайн-оплата сейчас недоступна", 503);
  if (mode === "mock") {
    await prisma.order.update({ where: { id: order.id }, data: { paymentMode: "mock" } });
    return ok({ order: orderPublic({ ...order, paymentMode: "mock" }), confirmationUrl: "", paymentMode: "mock" });
  }
  if (order.yookassaId && order.confirmationUrl && order.paymentStatus !== "failed") {
    return ok({ order: orderPublic(order), confirmationUrl: order.confirmationUrl, paymentMode: "yookassa" });
  }
  try {
    if (order.total <= 0) {
      const paid = await markOrderPaid(order.id);
      return ok({ order: orderPublic(paid || order), confirmationUrl: "", paymentMode: "yookassa" });
    }
    const payment = await createYookassaPayment(order);
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { yookassaId: payment.id, confirmationUrl: payment.confirmationUrl, paymentMode: "yookassa", paymentStatus: "pending" },
      include: { lines: true },
    });
    return ok({ order: orderPublic(updated), confirmationUrl: payment.confirmationUrl, paymentMode: "yookassa" });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "ЮKassa не создала платёж");
  }
}
