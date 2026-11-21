import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return fail("Нужен вход в админку", 401);
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    type?: string;
    value?: number;
    minOrder?: number;
    note?: string;
    active?: boolean;
  } | null;
  if (!body) return fail("Пустой запрос");
  const data: Record<string, unknown> = {};
  if (body.type !== undefined) data.type = body.type === "fixed" ? "fixed" : "percent";
  if (body.value !== undefined) {
    const value = Math.round(Number(body.value));
    if (!Number.isFinite(value) || value < 0) return fail("Укажите размер скидки");
    data.value = value;
  }
  if (body.minOrder !== undefined) data.minOrder = Math.max(0, Math.round(Number(body.minOrder) || 0));
  if (body.note !== undefined) data.note = body.note.trim().slice(0, 120);
  if (body.active !== undefined) data.active = Boolean(body.active);
  const promo = await prisma.promoCode.update({ where: { id }, data });
  return ok({
    promo: {
      id: promo.id,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      minOrder: promo.minOrder,
      active: promo.active,
      note: promo.note,
    },
  });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return fail("Нужен вход в админку", 401);
  const { id } = await context.params;
  await prisma.promoCode.delete({ where: { id } });
  return ok({ ok: true });
}
