"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoscow, rub } from "@/lib/money";
import { formatSource, NEXT_STATUS, PAYMENT_LABEL, STATUS_ACTION, STATUS_LABEL } from "@/lib/statuses";

type Order = {
  id: string;
  number: string;
  createdAt: string;
  name: string;
  phone: string;
  address: string;
  zoneName: string;
  comment: string;
  promoCode: string;
  total: number;
  paymentMethod: string;
  status: string;
  utmSource: string;
  utmCampaign: string;
  lines: { itemName: string; variantName: string; qty: number; sum: number }[];
};

const STATUSES = ["", "awaiting_payment", "awaiting_confirmation", "confirmed", "kitchen", "ready", "courier", "delivered", "cancelled"];

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("");
  const [pay, setPay] = useState("");
  const [source, setSource] = useState("");
  const [promo, setPromo] = useState("");
  const [q, setQ] = useState("");

  const query = new URLSearchParams({ status, pay, source, promo, q }).toString();

  async function load() {
    const res = await fetch(`/api/admin/orders?${query}`);
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const data = await res.json();
    setOrders(data.orders || []);
  }

  useEffect(() => {
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, pay, source, promo, q]);

  async function move(id: string, next: string) {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) load();
  }

  return (
    <div>
      <h1 className="block-title" style={{ fontSize: 28 }}>Заказы</h1>
      <div className="filters">
        <select value={status} onChange={(event) => setStatus(event.target.value)} data-testid="filter-status">
          <option value="">Все статусы</option>
          {STATUSES.filter(Boolean).map((item) => <option key={item} value={item}>{STATUS_LABEL[item]}</option>)}
        </select>
        <select value={pay} onChange={(event) => setPay(event.target.value)}>
          <option value="">Любая оплата</option>
          <option value="online">Онлайн (ЮKassa)</option>
          <option value="on_delivery">При получении</option>
        </select>
        <input value={source} onChange={(event) => setSource(event.target.value)} placeholder="Источник, utm" />
        <input value={promo} onChange={(event) => setPromo(event.target.value)} placeholder="Промокод" />
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Номер, телефон, имя" />
      </div>
      <a className="btn btn--main" href={`/api/admin/orders/export?${query}`} style={{ marginBottom: 12 }}>Скачать CSV</a>
      <div className="admin-list">
        {!orders.length ? <p className="empty">Заказов нет.</p> : orders.map((order) => (
          <article className="mini" key={order.id} data-testid="admin-order">
            <h3>{order.number}</h3>
            <p className="fine">{formatMoscow(order.createdAt)}</p>
            <p>Источник: {formatSource(order.utmSource, order.utmCampaign) || "—"}</p>
            <p>Промокод: {order.promoCode || "—"}</p>
            <p>{order.lines.map((line) => `${line.itemName}${line.variantName ? `, ${line.variantName}` : ""} × ${line.qty}`).join("; ")}</p>
            <p><strong>{rub(order.total)}</strong> · {PAYMENT_LABEL[order.paymentMethod]}</p>
            <p><span className="status-pill">{STATUS_LABEL[order.status] || order.status}</span></p>
            <p className="fine">{order.name}, {order.phone}<br />{order.zoneName}, {order.address}{order.comment ? ` · ${order.comment}` : ""}</p>
            <div className="actions">
              {(NEXT_STATUS[order.status] || []).map((next) => (
                <button key={next} className={next === "cancelled" ? "btn btn--ghost" : "btn btn--main"} type="button" onClick={() => move(order.id, next)}>
                  {STATUS_ACTION[next]}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
