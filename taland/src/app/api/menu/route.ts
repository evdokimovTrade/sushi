import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/http";
import { toCategory } from "@/lib/menu-map";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sort: "asc" },
    include: { items: { include: { variants: true } } },
  });
  const zones = await prisma.deliveryZone.findMany({
    where: { active: true },
    orderBy: { sort: "asc" },
  });
  return ok({
    categories: categories.map((category) => toCategory(category)),
    zones: zones.map((zone) => ({ id: zone.id, name: zone.name, minOrder: zone.minOrder, fee: zone.fee })),
  });
}
