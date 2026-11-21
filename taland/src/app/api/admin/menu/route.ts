import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { toCategory } from "@/lib/menu-map";
import { menuRuleError } from "@/lib/menu-rules";
import { safeImagePath } from "@/lib/photos";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return fail("Нужен вход в админку", 401);
  const categories = await prisma.category.findMany({
    orderBy: { sort: "asc" },
    include: { items: { include: { variants: true } } },
  });
  return ok({ categories: categories.map((category) => toCategory(category, { includeInactive: true })) });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return fail("Нужен вход в админку", 401);
  const body = (await request.json().catch(() => null)) as {
    categoryId?: string;
    name?: string;
    unit?: string;
    image?: string;
    section?: string;
    sectionName?: string;
    layout?: string;
    qtyOnly?: boolean;
    variants?: { name?: string; price?: number }[];
  } | null;
  if (!body) return fail("Пустой запрос");
  const categoryId = body.categoryId || "";
  if (categoryId === "burgers") return fail("Бургеров ровно три. Новую позицию не добавляем.");
  if (categoryId === "sushi") {
    const count = await prisma.menuItem.count({ where: { categoryId: "sushi" } });
    if (count >= 10) return fail("Суши: уже 10 позиций, это максимум.");
  }
  const variants = (body.variants || []).map((variant) => ({
    name: String(variant.name || "").trim().slice(0, 40),
    price: Math.round(Number(variant.price)),
  }));
  const qtyOnly = Boolean(body.qtyOnly);
  const rule = menuRuleError(categoryId, qtyOnly, variants.length);
  if (rule) return fail(rule);
  if (variants.some((variant) => !variant.name || !Number.isFinite(variant.price) || variant.price < 0)) {
    return fail("У каждого варианта нужны название и цена");
  }
  const name = String(body.name || "").trim().slice(0, 80);
  if (name.length < 2) return fail("Нужно название");
  const image = safeImagePath(body.image || "");
  if (image === null) return fail("Фото выбирается из загруженных картинок меню");
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return fail("Нет такой категории");
  const sort = await prisma.menuItem.count();
  const id = `custom-${crypto.randomBytes(4).toString("hex")}`;
  const item = await prisma.menuItem.create({
    data: {
      id,
      categoryId,
      name,
      unit: String(body.unit || "").trim().slice(0, 20),
      image,
      section: String(body.section || "").trim().slice(0, 40),
      sectionName: String(body.sectionName || "").trim().slice(0, 40),
      layout: body.layout === "compact" ? "compact" : "card",
      qtyOnly,
      active: true,
      sort,
      variants: {
        create: variants.map((variant, index) => ({
          id: `${id}__${index}-${crypto.randomBytes(2).toString("hex")}`,
          name: variant.name,
          price: variant.price,
          sort: index,
          active: true,
        })),
      },
    },
    include: { variants: true },
  });
  return ok({ id: item.id });
}
