"use client";

import { useState } from "react";
import { rub } from "@/lib/money";
import type { ItemDTO } from "@/lib/types";
import { useCart } from "./Providers";
import { ecommerce } from "@/lib/analytics";

export function MenuScreen({ categoryId }: { categoryId: string }) {
  const { categories, menuReady, add, toast } = useCart();
  const category = categories.find((entry) => entry.id === categoryId);
  const [pick, setPick] = useState<Record<string, string>>({});
  const [qty, setQty] = useState<Record<string, number>>({});

  if (!menuReady) {
    return <main className="wrap menu-loading"><p className="empty">Загружаем меню…</p></main>;
  }
  if (!category) {
    return <main className="wrap"><p className="empty">Раздел не найден.</p></main>;
  }

  const groups: { key: string; name: string; items: ItemDTO[] }[] = [];
  category.items.forEach((item) => {
    const key = item.section || "";
    let group = groups.find((entry) => entry.key === key);
    if (!group) {
      group = { key, name: item.sectionName || "", items: [] };
      groups.push(group);
    }
    group.items.push(item);
  });

  const withPhoto = category.items.filter((entry) => entry.image).map((entry) => entry.id);
  const photoIndex = (id: string) => withPhoto.indexOf(id);

  function chosen(item: ItemDTO) {
    return pick[item.id] || item.variants[0].id;
  }
  function count(item: ItemDTO) {
    return qty[item.id] || 1;
  }
  function onAdd(item: ItemDTO) {
    const variant = item.variants.find((entry) => entry.id === chosen(item)) || item.variants[0];
    add(item.id, variant.id, count(item));
    ecommerce("add", [{ id: `${item.id}:${variant.id}`, name: item.name, category: category?.fullName, variant: variant.name, price: variant.price, quantity: count(item) }]);
    const extra = !item.qtyOnly && item.variants.length > 1 ? `, ${variant.name}` : "";
    toast(`${item.name}${extra} — добавлено`);
  }

  return (
    <main className="wrap">
      <div className="page-head">
        <h1>{category.fullName}</h1>
        {category.priceNote ? <p className="price-note">{category.priceNote}</p> : null}
      </div>
      {groups.map((group) => {
        const compact = group.items.every((item) => item.layout === "compact");
        return (
          <section key={group.key || "main"}>
            {group.name ? <h2 className="section-title">{group.name}</h2> : null}
            <div className={compact ? "compact-list" : "grid"}>
              {group.items.map((item) => {
                const variant = item.variants.find((entry) => entry.id === chosen(item)) || item.variants[0];
                const q = count(item);
                const showVars = !item.qtyOnly && item.variants.length > 1;
                if (compact) {
                  return (
                    <article className="row-card" key={item.id} data-item={item.id}>
                      <div className="row-card__name">{item.name}</div>
                      <div className="row-card__price">{rub(variant.price * q)}</div>
                      <div className="row-card__ops">
                        <Qty itemId={item.id} value={q} onChange={(next) => setQty((prev) => ({ ...prev, [item.id]: next }))} />
                        <button className="add" type="button" data-add={item.id} data-track="add_to_cart" data-p-item={item.id} data-p-variant={variant.id} data-p-qty={String(q)} data-p-category={categoryId} onClick={() => onAdd(item)}>В заказ</button>
                      </div>
                    </article>
                  );
                }
                return (
                  <article className="card" key={item.id} data-item={item.id}>
                    {item.image ? <img className="card__photo" src={item.image} alt={item.name} width={800} height={500} loading={photoIndex(item.id) > 1 ? "lazy" : "eager"} decoding="async" /> : null}
                    <div className="card__head">
                      <div className="card__name">{item.name}</div>
                      {item.unit ? <div className="card__unit">{item.unit}</div> : null}
                    </div>
                    {showVars ? (
                      <div className="vars">
                        {item.variants.map((option) => (
                          <button
                            key={option.id}
                            className="var"
                            type="button"
                            aria-pressed={option.id === variant.id}
                            data-track="menu_variant_select"
                            data-p-item={item.id}
                            data-p-variant={option.id}
                            onClick={() => setPick((prev) => ({ ...prev, [item.id]: option.id }))}
                          >
                            <span className="var__name">{option.name}</span>
                            <span className="var__price">{rub(option.price)}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <div className="card__foot">
                      <div className="live">Цена: <b>{rub(variant.price * q)}</b></div>
                      <Qty itemId={item.id} value={q} onChange={(next) => setQty((prev) => ({ ...prev, [item.id]: next }))} />
                      <button className="add" type="button" data-add={item.id} data-track="add_to_cart" data-p-item={item.id} data-p-variant={variant.id} data-p-qty={String(q)} data-p-category={categoryId} onClick={() => onAdd(item)}>В заказ</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}

function Qty({ itemId, value, onChange }: { itemId: string; value: number; onChange: (next: number) => void }) {
  return (
    <div className="qty">
      <button type="button" aria-label="Меньше" data-track="menu_qty_minus" data-p-item={itemId} onClick={() => onChange(Math.max(1, value - 1))}>−</button>
      <span>{value}</span>
      <button type="button" aria-label="Больше" data-track="menu_qty_plus" data-p-item={itemId} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}
