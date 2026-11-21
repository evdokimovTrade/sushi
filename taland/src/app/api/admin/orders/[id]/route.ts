import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { NEXT_STATUS } from "@/lib/statuses";
import { orderPublic } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return fail("Нужен вход в админку", 401);
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { status?: string } | null;
  const next = body?.status || "";
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return fail("Заказ не найден", 404);
  const allowed = NEXT_STATUS[order.status] || [];
  if (!allowed.includes(next)) return fail("Такой переход статуса недоступен");
  const updated = await prisma.order.update({
    where: { id },
    data: { status: next },
    include: { lines: true },
  });
  return ok({ order: orderPublic(updated) });
}
