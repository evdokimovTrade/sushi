import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/http";
import { calcDiscount } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: string; subtotal?: number } | null;
  const code = String(body?.code || "").trim().toUpperCase();
  const subtotal = Math.max(0, Math.round(Number(body?.subtotal) || 0));
  if (!code) return ok({ discount: 0, code: "" });
  const promo = await prisma.promoCode.findUnique({ where: { code } });
  if (!promo || !promo.active) return fail("Промокод не найден");
  const result = calcDiscount(subtotal, {
    type: promo.type,
    value: promo.value,
    minOrder: promo.minOrder,
    active: promo.active,
    expiresAt: promo.expiresAt ? promo.expiresAt.toISOString() : null,
  });
  if (result.error) return fail(result.error);
  return ok({ discount: result.discount, code: promo.code });
}
