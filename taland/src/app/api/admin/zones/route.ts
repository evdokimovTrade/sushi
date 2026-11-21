import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return fail("Нужен вход в админку", 401);
  const zones = await prisma.deliveryZone.findMany({ orderBy: { sort: "asc" } });
  return ok({
    zones,
    payment: {
      mode: (process.env.YOOKASSA_SHOP_ID || "").trim() ? "yookassa" : "mock",
      testMode: (process.env.YOOKASSA_TEST_MODE ?? "true") !== "false",
      receipt: (process.env.YOOKASSA_SEND_RECEIPT ?? "true") !== "false",
      vatCode: process.env.YOOKASSA_VAT_CODE || "1",
      authMode: process.env.AUTH_MODE || "dev",
    },
  });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) return fail("Нужен вход в админку", 401);
  const body = (await request.json().catch(() => null)) as {
    zones?: { id: string; name?: string; minOrder?: number; fee?: number; active?: boolean }[];
  } | null;
  if (!body?.zones?.length) return fail("Нет данных");
  for (const zone of body.zones) {
    const minOrder = Math.max(0, Math.round(Number(zone.minOrder)));
    const fee = Math.max(0, Math.round(Number(zone.fee)));
    if (!Number.isFinite(minOrder) || !Number.isFinite(fee)) return fail("Проверьте суммы");
    await prisma.deliveryZone.update({
      where: { id: zone.id },
      data: {
        name: zone.name ? String(zone.name).trim().slice(0, 40) : undefined,
        minOrder,
        fee,
        active: zone.active !== false,
      },
    });
  }
  const zones = await prisma.deliveryZone.findMany({ orderBy: { sort: "asc" } });
  return ok({ zones });
}
