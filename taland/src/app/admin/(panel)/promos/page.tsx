"use client";

import { useEffect, useState } from "react";

type Promo = { id: string; code: string; type: string; value: number; minOrder: number; active: boolean; note: string };

export default function PromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [code, setCode] = useState("");
  const [type, setType] = useState("percent");
  const [value, setValue] = useState(10);
  const [minOrder, setMinOrder] = useState(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/promos");
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setPromos(data.promos || []);
  }
  useEffect(() => { load(); }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/admin/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, type, value, minOrder, note }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Не сохранилось");
      return;
    }
    setCode("");
    setNote("");
    load();
  }

  async function toggle(promo: Promo) {
    await fetch(`/api/admin/promos/${promo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !promo.active }),
    });
    load();
  }

  return (
    <div>
      <h1 className="block-title" style={{ fontSize: 28 }}>Промокоды</h1>
      <p className="fine">TALAND10 и NOVY500 — примеры. Скидка считается от суммы блюд, доставка не уменьшается.</p>
      <div className="admin-list" style={{ margin: "12px 0" }}>
        {promos.map((promo) => (
          <article className="mini" key={promo.id}>
            <strong>{promo.code}</strong>
            <p>{promo.type === "percent" ? `${promo.value}%` : `${promo.value} ₽`} · от {promo.minOrder} ₽ · {promo.active ? "включён" : "выключен"}</p>
            {promo.note ? <p className="fine">{promo.note}</p> : null}
            <button className="btn btn--ghost" type="button" onClick={() => toggle(promo)}>{promo.active ? "Выключить" : "Включить"}</button>
          </article>
        ))}
      </div>
      <form className="panel stack" onSubmit={create}>
        <h2>Новый код</h2>
        {error ? <p className="form-error">{error}</p> : null}
        <label>Код<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="LET0" /></label>
        <label>Тип
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="percent">Процент</option>
            <option value="fixed">Сумма, ₽</option>
          </select>
        </label>
        <label>Размер<input type="number" value={value} onChange={(event) => setValue(Number(event.target.value))} /></label>
        <label>Минимальная сумма блюд<input type="number" value={minOrder} onChange={(event) => setMinOrder(Number(event.target.value))} /></label>
        <label>Заметка<input value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <button className="btn btn--main" type="submit">Добавить</button>
      </form>
    </div>
  );
}
