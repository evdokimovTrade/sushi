import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { menuRuleError } from "@/lib/menu-rules";
import { safeImagePath } from "@/lib/photos";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return fail("Нужен вход в админку", 401);
  const { id } = await context.params;
  const item = await prisma.menuItem.findUnique({ where: { id }, include: { variants: true } });
  if (!item) return fail("Позиция не найдена", 404);
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    unit?: string;
    image?: string;
    active?: boolean;
    section?: string;
    sectionName?: string;
    layout?: string;
    qtyOnly?: boolean;
    variants?: { id?: string; name?: string; price?: number; active?: boolean }[];
  } | null;
  if (!body) return fail("Пустой запрос");

  const qtyOnly = body.qtyOnly === undefined ? item.qtyOnly : Boolean(body.qtyOnly);
  if ((item.categoryId === "sushi" || item.categoryId === "burgers") && qtyOnly) {
    return fail("У суши и бургеров всегда три фиксированных варианта, без допов.");
  }
  const data: Prisma.MenuItemUpdateInput = {};
  if (body.name !== undefined) {
    const name = body.name.trim().slice(0, 80);
    if (name.length < 2) return fail("Нужно название");
    data.name = name;
  }
  if (body.unit !== undefined) data.unit = body.unit.trim().slice(0, 20);
  if (body.image !== undefined) {
    const image = safeImagePath(body.image);
    if (image === null) return fail("Фото выбирается из загруженных картинок меню");
    data.image = image;
  }
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.section !== undefined) data.section = body.section.trim().slice(0, 40);
  if (body.sectionName !== undefined) data.sectionName = body.sectionName.trim().slice(0, 40);
  if (body.layout !== undefined) data.layout = body.layout === "compact" ? "compact" : "card";
  data.qtyOnly = qtyOnly;

  if (body.variants) {
    const variants = body.variants.map((variant) => ({
      id: variant.id,
      name: String(variant.name || "").trim().slice(0, 40),
      price: Math.round(Number(variant.price)),
      active: variant.active !== false,
    }));
    const rule = menuRuleError(item.categoryId, qtyOnly, variants.length);
    if (rule) return fail(rule);
    if (variants.some((variant) => !variant.name || !Number.isFinite(variant.price) || variant.price < 0)) {
      return fail("У каждого варианта нужны название и цена");
    }
    const keep = new Set(variants.map((variant) => variant.id).filter(Boolean) as string[]);
    await prisma.variant.deleteMany({ where: { itemId: item.id, id: { notIn: [...keep] } } });
    for (let index = 0; index < variants.length; index++) {
      const variant = variants[index];
      if (variant.id && item.variants.some((existing) => existing.id === variant.id)) {
        await prisma.variant.update({
          where: { id: variant.id },
          data: { name: variant.name, price: variant.price, sort: index, active: variant.active },
        });
      } else {
        await prisma.variant.create({
          data: {
            id: `${item.id}__${index}-${crypto.randomBytes(2).toString("hex")}`,
            itemId: item.id,
            name: variant.name,
            price: variant.price,
            sort: index,
            active: variant.active,
          },
        });
      }
    }
  } else if (body.qtyOnly !== undefined) {
    const count = item.variants.length;
    const rule = menuRuleError(item.categoryId, qtyOnly, count);
    if (rule) return fail(rule);
  }

  await prisma.menuItem.update({ where: { id: item.id }, data });
  return ok({ ok: true });
}
