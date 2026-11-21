import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/http";
import { markOrderPaid } from "@/lib/orders";
import { fetchYookassaPayment } from "@/lib/yookassa";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    event?: string;
    object?: { id?: string; metadata?: { orderId?: string } };
  } | null;
  const paymentId = body?.object?.id || "";
  if (!paymentId) return ok({ ignored: true });
  const remote = await fetchYookassaPayment(paymentId);
  if (!remote) return fail("Не удалось проверить платёж в ЮKassa", 502);
  const orderId = remote.metadata?.orderId || body?.object?.metadata?.orderId || "";
  const order = orderId
    ? await prisma.order.findUnique({ where: { id: orderId } })
    : await prisma.order.findFirst({ where: { yookassaId: paymentId } });
  if (!order || order.yookassaId !== paymentId) return ok({ ignored: true });
  if (remote.status === "succeeded" && remote.paid) {
    await markOrderPaid(order.id);
  } else if (remote.status === "canceled" && order.paymentStatus !== "paid") {
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "failed" } });
  }
  return ok({ ok: true });
}
