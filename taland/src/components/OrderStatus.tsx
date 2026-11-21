"use client";

import { useEffect, useState } from "react";
import { rub, formatMoscow } from "@/lib/money";
import { PAYMENT_LABEL, STATUS_LABEL } from "@/lib/statuses";
import { formatPhone } from "@/lib/phone";

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
  discount: number;
  deliveryFee: number;
  subtotal: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  paymentMode: string;
  confirmationUrl: string;
  lines: { itemName: string; variantName: string; qty: number; sum: number }[];
};

export function OrderStatus({ id, pay }: { id: string; pay?: boolean }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function load() {
    const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Заказ не найден");
      return;
    }
    setOrder(data.order);
  }

  useEffect(() => {
    load().catch(() => setError("Не удалось загрузить заказ"));
    const timer = window.setInterval(() => {
      load().catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function mockPay() {
    setPending(true);
    setError("");
    const res = await fetch("/api/payments/mock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Не удалось подтвердить оплату");
      return;
    }
    setOrder(data.order);
  }

  if (error && !order) return <div className="panel"><p className="form-error">{error}</p></div>;
  if (!order) return <div className="panel"><p className="empty">Загружаем заказ…</p></div>;

  const waitingPay = pay && order.status === "awaiting_payment";
  return (
    <div className="panel" data-testid="order-status">
      <h2>{order.number}</h2>
      <p className="fine">{formatMoscow(order.createdAt)} МСК</p>
      <p style={{ margin: "8px 0" }}><span className="status-pill">{STATUS_LABEL[order.status] || order.status}</span></p>
      {order.status === "kitchen" ? <p>Оплата прошла, заказ передан на кухню.</p> : null}
      {order.status === "awaiting_confirmation" ? <p>Заявка принята и ждёт подтверждения менеджера. После подтверждения её отдадут на кухню.</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {waitingPay ? (
        <div className="stack" style={{ margin: "12px 0" }}>
          {order.paymentMode === "mock" ? (
            <>
              <p className="price-note">Ключи ЮKassa не заданы. Это тестовое подтверждение: статус станет «на кухне», деньги не списываются. Когда в .env появятся тестовые shopId и секрет, кнопка уведёт на страницу ЮKassa.</p>
              <button className="btn btn--main" type="button" disabled={pending} onClick={mockPay} data-testid="mock-pay">Подтвердить тестовую оплату</button>
            </>
          ) : (
            <>
              <p className="pay-note">Оплата картой или через СБП на стороне ЮKassa. После возврата статус обновится сам, вебхук тоже отметит заказ оплаченным.</p>
              {order.confirmationUrl ? (
                <a className="btn btn--main" href={order.confirmationUrl}>Оплатить картой или СБП</a>
              ) : (
                <>
                  <p className="form-error">Ссылка на оплату ещё не создана. Проверьте ключи ЮKassa и повторите.</p>
                  <button className="btn btn--main" type="button" disabled={pending} onClick={async () => {
                    setPending(true);
                    const res = await fetch("/api/payments/create", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ orderId: id }),
                    });
                    const data = await res.json();
                    setPending(false);
                    if (!res.ok) setError(data.error || "ЮKassa не создала платёж");
                    else if (data.order) setOrder(data.order);
                  }}>Создать ссылку на оплату</button>
                </>
              )}
            </>
          )}
        </div>
      ) : null}
      {order.lines.map((line, index) => (
        <div className="line" key={index}>
          <div className="line__name">{line.itemName}{line.variantName ? `, ${line.variantName}` : ""} × {line.qty}</div>
          <div className="line__sum">{rub(line.sum)}</div>
        </div>
      ))}
      <div className="totals">
        <div className="row"><span>Блюда</span><span>{rub(order.subtotal)}</span></div>
        {order.discount ? <div className="row"><span>Скидка {order.promoCode}</span><span>−{rub(order.discount)}</span></div> : null}
        <div className="row"><span>Доставка, {order.zoneName}</span><span>{rub(order.deliveryFee)}</span></div>
        <div className="row grand"><span>Итого</span><span>{rub(order.total)}</span></div>
      </div>
      <p className="fine" style={{ marginTop: 10 }}>
        {order.name}, {formatPhone(order.phone)}<br />
        {order.address}<br />
        Оплата: {PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}
        {order.comment ? <><br />{order.comment}</> : null}
      </p>
      <div className="actions">
        <a className="btn btn--ghost" href="/account">Кабинет</a>
        <a className="btn btn--ghost" href="/">На главную</a>
      </div>
    </div>
  );
}
