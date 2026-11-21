"use client";

import { useEffect, useState } from "react";
import { MENU_PHOTOS } from "@/lib/photos";
import { rub } from "@/lib/money";
import type { CategoryDTO, ItemDTO } from "@/lib/types";

type Draft = {
  name: string;
  unit: string;
  image: string;
  active: boolean;
  qtyOnly: boolean;
  layout: "card" | "compact";
  variants: { id?: string; name: string; price: number }[];
};

function draftOf(item: ItemDTO): Draft {
  return {
    name: item.name,
    unit: item.unit,
    image: item.image,
    active: item.active !== false,
    qtyOnly: item.qtyOnly,
    layout: item.layout,
    variants: item.variants.map((variant) => ({ id: variant.id, name: variant.name, price: variant.price })),
  };
}

export default function MenuEditor() {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  async function load() {
    const res = await fetch("/api/admin/menu");
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setCategories(data.categories || []);
  }

  useEffect(() => { load(); }, []);

  function edit(item: ItemDTO) {
    setOpen(item.id);
    setDraft(draftOf(item));
    setError("");
    setSaved("");
  }

  async function save(item: ItemDTO) {
    if (!draft) return;
    setError("");
    const res = await fetch(`/api/admin/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Не сохранилось");
      return;
    }
    setSaved("Сохранено");
    await load();
  }

  async function toggle(item: ItemDTO) {
    await fetch(`/api/admin/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: item.active === false }),
    });
    load();
  }

  return (
    <div>
      <h1 className="block-title" style={{ fontSize: 28 }}>Меню</h1>
      <p className="price-note">Суши — не больше 10, у каждой ровно 3 варианта. Бургеров ровно 3. Шашлык: 2–4 варианта у блюда, гарниры, соусы, соленья и напитки только количеством. Допов, удаления ингредиентов и комбо нет. Цены суши и бургеров — пример, шашлык — черновик.</p>
      {error ? <p className="form-error">{error}</p> : null}
      {saved ? <p className="fine">{saved}</p> : null}
      {categories.map((category) => (
        <section key={category.id} style={{ marginTop: 18 }}>
          <h2 className="section-title">{category.fullName}</h2>
          <p className="fine">{category.priceNote}</p>
          <div className="admin-list" style={{ marginTop: 8 }}>
            {category.items.map((item) => (
              <article className="mini" key={item.id}>
                <div className="stat-row">
                  <strong>{item.name}</strong>
                  <button className="btn btn--ghost" type="button" onClick={() => toggle(item)}>{item.active === false ? "Выключено" : "В меню"}</button>
                </div>
                <p className="fine">{item.variants.map((variant) => `${variant.name} ${rub(variant.price)}`).join(" · ")}</p>
                <button className="btn btn--main" type="button" data-edit={item.id} onClick={() => edit(item)}>Изменить</button>
                {open === item.id && draft ? (
                  <div className="stack" data-testid="menu-editor">
                    <label>Название<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
                    <label>Порция, подпись<input value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} placeholder="8 шт" /></label>
                    <label>Фото
                      <select value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })}>
                        <option value="">Без фото</option>
                        {MENU_PHOTOS.map((src) => <option key={src} value={src}>{src.replace("/img/", "")}</option>)}
                      </select>
                    </label>
                    {draft.image ? <img src={draft.image} alt="" style={{ width: 120, borderRadius: 8 }} /> : null}
                    {draft.variants.map((variant, index) => (
                      <div key={variant.id || index} className="stat-row">
                        <input
                          aria-label="Название варианта"
                          value={variant.name}
                          disabled={draft.qtyOnly}
                          onChange={(event) => {
                            const variants = draft.variants.slice();
                            variants[index] = { ...variant, name: event.target.value };
                            setDraft({ ...draft, variants });
                          }}
                        />
                        <input
                          aria-label="Цена"
                          type="number"
                          value={variant.price}
                          style={{ maxWidth: 110 }}
                          onChange={(event) => {
                            const variants = draft.variants.slice();
                            variants[index] = { ...variant, price: Number(event.target.value) };
                            setDraft({ ...draft, variants });
                          }}
                        />
                      </div>
                    ))}
                    <p className="fine">Число вариантов фиксировано правилом кухни. Новые допы добавить нельзя.</p>
                    <button className="btn btn--main" type="button" onClick={() => save(item)}>Сохранить</button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
