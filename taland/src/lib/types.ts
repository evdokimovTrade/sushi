export type VariantDTO = { id: string; name: string; price: number; active?: boolean };
export type ItemDTO = {
  id: string;
  categoryId: string;
  name: string;
  unit: string;
  image: string;
  section: string;
  sectionName: string;
  layout: "card" | "compact";
  qtyOnly: boolean;
  active?: boolean;
  variants: VariantDTO[];
};
export type CategoryDTO = {
  id: string;
  name: string;
  fullName: string;
  priceNote: string;
  items: ItemDTO[];
};
export type ZoneDTO = { id: string; name: string; minOrder: number; fee: number };
export type CartLine = { itemId: string; variantId: string; qty: number };
export type CustomerDraft = { name: string; phone: string; address: string; comment: string; promo: string };
