import { PrismaClient } from "@prisma/client";
import { ensureDatabaseUrl } from "../src/lib/db-url";
import { CATEGORIES, EXAMPLE_PROMOS, EXAMPLE_ZONES, MENU, variantKey } from "./menu-data";

ensureDatabaseUrl();
const prisma = new PrismaClient();

async function main() {
  await prisma.variant.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();

  for (const category of CATEGORIES) {
    await prisma.category.create({ data: category });
  }

  for (let index = 0; index < MENU.length; index++) {
    const item = MENU[index];
    await prisma.menuItem.create({
      data: {
        id: item.id,
        categoryId: item.cat,
        name: item.name,
        unit: item.unit || "",
        image: item.img || "",
        section: item.section || "",
        sectionName: item.sectionName || "",
        layout: item.layout || "card",
        qtyOnly: Boolean(item.qtyOnly),
        active: true,
        sort: index,
        variants: {
          create: item.variants.map((variant, sort) => ({
            id: variantKey(item.id, variant.id),
            name: variant.name,
            price: variant.price,
            sort,
            active: true,
          })),
        },
      },
    });
  }

  for (const zone of EXAMPLE_ZONES) {
    await prisma.deliveryZone.upsert({
      where: { id: zone.id },
      create: { ...zone, active: true },
      update: {},
    });
  }

  for (const promo of EXAMPLE_PROMOS) {
    await prisma.promoCode.upsert({
      where: { code: promo.code },
      create: { ...promo, active: true },
      update: {},
    });
  }

  const counts = {
    items: await prisma.menuItem.count(),
    variants: await prisma.variant.count(),
    zones: await prisma.deliveryZone.count(),
  };
  console.log("Меню записано", counts);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
