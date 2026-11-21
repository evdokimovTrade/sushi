import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function present(promo: {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  active: boolean;
  note: string;
  expiresAt: Date | null;
}) {
  return {
    id: promo.id,
    code: promo.code,
    type: promo.type,
    value: promo.value,
    minOrder: promo.minOrder,
    active: promo.active,
    note: promo.note,
    expiresAt: promo.expiresAt ? promo.expiresAt.toISOString() : null,
  };
}

export async function GET() {
  if (!(await requireAdmin())) return fail("Нужен вход в админку", 401);
  const promos = await prisma.promoCode.findMany({ orderBy: { code: "asc" } });
  return ok({ promos: promos.map(present) });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return fail("Нужен вход в админку", 401);
  const body = (await request.json().catch(() => null)) as {
    code?: string;
    type?: string;
    value?: number;
    minOrder?: number;
    note?: string;
    active?: boolean;
  } | null;
  const code = String(body?.code || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9_-]{3,20}$/.test(code)) return fail("Код: 3–20 символов, латиница и цифры");
  const type = body?.type === "fixed" ? "fixed" : "percent";
  const value = Math.round(Number(body?.value));
  const minOrder = Math.max(0, Math.round(Number(body?.minOrder) || 0));
  if (!Number.isFinite(value) || value < 0) return fail("Укажите размер скидки");
  if (type === "percent" && value > 100) return fail("Процент не больше 100");
  try {
    const promo = await prisma.promoCode.create({
      data: {
        code,
        type,
        value,
        minOrder,
        note: String(body?.note || "").trim().slice(0, 120),
        active: body?.active !== false,
      },
    });
    return ok({ promo: present(promo) });
  } catch {
    return fail("Такой промокод уже есть");
  }
}
