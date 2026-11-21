import type { Category, MenuItem, Variant } from "@prisma/client";
import type { CategoryDTO, ItemDTO } from "./types";

type ItemWithVariants = MenuItem & { variants: Variant[] };

export function toItem(item: ItemWithVariants, opts?: { includeInactive?: boolean }): ItemDTO {
  const variants = item.variants
    .filter((variant) => opts?.includeInactive || variant.active)
    .sort((a, b) => a.sort - b.sort)
    .map((variant) => ({
      id: variant.id,
      name: variant.name,
      price: variant.price,
      ...(opts?.includeInactive ? { active: variant.active } : {}),
    }));
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    unit: item.unit,
    image: item.image,
    section: item.section,
    sectionName: item.sectionName,
    layout: item.layout === "compact" ? "compact" : "card",
    qtyOnly: item.qtyOnly,
    ...(opts?.includeInactive ? { active: item.active } : {}),
    variants,
  };
}

export function toCategory(category: Category & { items: ItemWithVariants[] }, opts?: { includeInactive?: boolean }): CategoryDTO {
  const items = category.items
    .filter((item) => opts?.includeInactive || (item.active && item.variants.some((variant) => variant.active)))
    .sort((a, b) => a.sort - b.sort)
    .map((item) => toItem(item, opts))
    .filter((item) => item.variants.length > 0);
  return {
    id: category.id,
    name: category.name,
    fullName: category.fullName,
    priceNote: category.priceNote,
    items,
  };
}
