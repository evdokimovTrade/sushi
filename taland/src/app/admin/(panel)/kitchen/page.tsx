"use client";

import { useEffect, useState } from "react";
import { formatMoscow } from "@/lib/money";

type Order = {
  id: string;
  number: string;
  createdAt: string;
  name: string;
  comment: string;
  address: string;
  zoneName: string;
  lines: { itemName: string; variantName: string; qty: number }[];
};

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  async function load() {
    const res = await fetch("/api/admin/orders?status=kitchen");
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setOrders((data.orders || []).slice().reverse());
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 8000);
    return () => window.clearInterval(timer);
  }, []);

  async function ready(id: string) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ready" }),
    });
    load();
  }

  return (
    <div>
      <h1 className="block-title" style={{ fontSize: 28 }}>Кухня</h1>
      <p className="fine">Заказы со статусом «на кухне». Старые сверху. Экран обновляется сам.</p>
      {!orders ? <p className="empty">Загружаем…</p> : !orders.length ? <p className="empty">Сейчас готовить нечего.</p> : (
        <div className="admin-list" style={{ marginTop: 12 }}>
          {orders.map((order) => (
            <article className="kitchen-card" key={order.id} data-testid="kitchen-order">
              <h2>{order.number}</h2>
              <p className="fine">{formatMoscow(order.createdAt)} · {order.name}</p>
              {order.lines.map((line, index) => (
                <div className="kitchen-item" key={index}>
                  <span>{line.itemName}{line.variantName ? `, ${line.variantName}` : ""}</span>
                  <b>× {line.qty}</b>
                </div>
              ))}
              {order.comment ? <p>Комментарий: {order.comment}</p> : null}
              <p className="fine">{order.zoneName}, {order.address}</p>
              <button className="btn btn--main" type="button" onClick={() => ready(order.id)}>Готово</button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
