import { fail, ok } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (!user) return fail("Войдите по телефону", 401);
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const zones = await prisma.deliveryZone.findMany();
  const names = new Map(zones.map((zone) => [zone.id, zone.name]));
  return ok({
    addresses: addresses.map((address) => ({
      id: address.id,
      zoneId: address.zoneId,
      zoneName: names.get(address.zoneId) || address.zoneId,
      text: address.text,
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return fail("Войдите по телефону", 401);
  const body = (await request.json().catch(() => null)) as { zoneId?: string; text?: string } | null;
  const text = String(body?.text || "").trim().slice(0, 200);
  const zone = await prisma.deliveryZone.findFirst({ where: { id: body?.zoneId || "", active: true } });
  if (!zone) return fail("Выберите район");
  if (text.length < 5) return fail("Слишком короткий адрес");
  const created = await prisma.address.create({ data: { userId: user.id, zoneId: zone.id, text } });
  return ok({ address: { id: created.id, zoneId: zone.id, zoneName: zone.name, text } });
}
