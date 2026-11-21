"use client";

import { useEffect, useState } from "react";

type Zone = { id: string; name: string; minOrder: number; fee: number; active: boolean };
type Info = { mode: string; testMode: boolean; receipt: boolean; vatCode: string; authMode: string };

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [info, setInfo] = useState<Info | null>(null);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    fetch("/api/admin/zones").then(async (res) => {
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const data = await res.json();
      setZones(data.zones || []);
      setInfo(data.payment || null);
    });
  }, []);

  function patch(id: string, data: Partial<Zone>) {
    setZones((prev) => prev.map((zone) => zone.id === id ? { ...zone, ...data } : zone));
  }

  async function save() {
    const res = await fetch("/api/admin/zones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zones }),
    });
    if (res.ok) setSaved("Сохранено. Новые заказы считают по этим цифрам.");
  }

  return (
    <div>
      <h1 className="block-title" style={{ fontSize: 28 }}>Зоны доставки</h1>
      <p className="price-note">Суммы ниже — пример, чтобы заказ можно было посчитать. Поставьте свои минимум и стоимость доставки.</p>
      <div className="admin-list" style={{ marginTop: 12 }}>
        {zones.map((zone) => (
          <article className="mini" key={zone.id}>
            <strong>{zone.name}</strong>
            <label>Минимальный заказ, ₽<input type="number" value={zone.minOrder} onChange={(event) => patch(zone.id, { minOrder: Number(event.target.value) })} /></label>
            <label>Доставка, ₽<input type="number" value={zone.fee} onChange={(event) => patch(zone.id, { fee: Number(event.target.value) })} /></label>
            <label className="check">
              <input type="checkbox" checked={zone.active} onChange={(event) => patch(zone.id, { active: event.target.checked })} />
              Район принимаем
            </label>
          </article>
        ))}
      </div>
      <button className="btn btn--main" type="button" onClick={save} style={{ marginTop: 12 }}>Сохранить зоны</button>
      {saved ? <p className="fine">{saved}</p> : null}
      {info ? (
        <div className="panel" style={{ marginTop: 16 }}>
          <h2>Оплата и вход</h2>
          <p>ЮKassa: {info.mode === "yookassa" ? "ключи заданы" : "ключей нет, тестовое подтверждение"}.</p>
          <p>Тестовый режим флага: {info.testMode ? "включён" : "выключен"}.</p>
          <p>Чек в запросе платежа: {info.receipt ? "передаём" : "не передаём"}. НДС, код {info.vatCode}.</p>
          <p>Вход клиента: {info.authMode === "sms" ? "SMS" : "тестовый код на экране"}.</p>
          <p className="fine">Ключи, НДС и режим чека меняются в .env, не в этой форме. Так секрет не попадает в базу.</p>
        </div>
      ) : null}
    </div>
  );
}
