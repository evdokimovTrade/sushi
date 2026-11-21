"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoscow, rub } from "@/lib/money";
import { STATUS_LABEL, PAYMENT_LABEL } from "@/lib/statuses";
import { useCart } from "@/components/Providers";

type Order = {
  id: string;
  number: string;
  createdAt: string;
  status: string;
  total: number;
  paymentMethod: string;
  zoneName: string;
  address: string;
  lines: { itemId: string; itemName: string; variantId: string; variantName: string; qty: number; sum: number }[];
};
type Address = { id: string; zoneId: string; zoneName: string; text: string };

export default function AccountPage() {
  const router = useRouter();
  const cart = useCart();
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const me = await fetch("/api/auth/me").then((res) => res.json());
    if (!me.user) {
      router.replace("/account/login");
      return;
    }
    setPhone(me.user.phonePretty || me.user.phone);
    const [orderData, addressData] = await Promise.all([
      fetch("/api/account/orders").then((res) => res.json()),
      fetch("/api/account/addresses").then((res) => res.json()),
    ]);
    setOrders(orderData.orders || []);
    setAddresses(addressData.addresses || []);
  }

  useEffect(() => {
    load().catch(() => setError("Не удалось открыть кабинет"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/account/login");
  }

  async function removeAddress(id: string) {
    await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    setAddresses((prev) => prev.filter((address) => address.id !== id));
  }

  function repeat(order: Order) {
    const available = order.lines.filter((line) => {
      const item = cart.items.find((entry) => entry.id === line.itemId);
      return item?.variants.some((variant) => variant.id === line.variantId);
    });
    if (!available.length) {
      cart.toast("Этих блюд уже нет в меню");
      return;
    }
    cart.replaceLines(available.map((line) => ({ itemId: line.itemId, variantId: line.variantId, qty: line.qty })));
    if (available.length < order.lines.length) cart.toast("Часть позиций уже не продаётся");
    else cart.toast("Заказ снова в корзине");
    router.push("/cart");
  }

  if (!orders) return <main className="wrap"><p className="empty">{error || "Загружаем кабинет…"}</p></main>;

  return (
    <main className="wrap">
      <div className="page-head">
        <h1>Кабинет</h1>
        <p className="fine">{phone}</p>
      </div>
      <section className="panel" style={{ marginBottom: 14 }}>
        <h2>Адреса</h2>
        {!addresses.length ? <p className="empty">Сохранённых адресов нет. Адрес можно сохранить при оформлении.</p> : (
          <div className="addr-list">
            {addresses.map((address) => (
              <div className="mini" key={address.id}>
                <strong>{address.zoneName}</strong>
                <span>{address.text}</span>
                <button className="rm" type="button" onClick={() => removeAddress(address.id)}>Удалить</button>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="panel">
        <h2>Заказы</h2>
        {!orders.length ? <p className="empty">Заказов пока нет.</p> : (
          <div className="order-list">
            {orders.map((order) => (
              <article className="mini" key={order.id} data-testid="account-order">
                <h3>{order.number}</h3>
                <p className="fine">{formatMoscow(order.createdAt)} · {order.zoneName}</p>
                <p><span className="status-pill">{STATUS_LABEL[order.status] || order.status}</span></p>
                {order.lines.map((line, index) => (
                  <p key={index}>{line.itemName}{line.variantName ? `, ${line.variantName}` : ""} × {line.qty}</p>
                ))}
                <p><strong>{rub(order.total)}</strong> · {PAYMENT_LABEL[order.paymentMethod]}</p>
                <div className="actions">
                  <button className="btn btn--main" type="button" onClick={() => repeat(order)}>Повторить</button>
                  <a className="btn btn--ghost" href={`/order/${order.id}`}>Открыть</a>
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="actions" style={{ marginTop: 12 }}>
          <button className="btn btn--ghost" type="button" onClick={logout}>Выйти</button>
        </div>
      </section>
    </main>
  );
}
