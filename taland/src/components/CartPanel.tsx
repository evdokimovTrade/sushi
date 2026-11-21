"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { rub } from "@/lib/money";
import { useCart } from "./Providers";
import { attributionForOrder, ecommerce, track } from "@/lib/analytics";

export function CartPanel({ mode }: { mode: "cart" | "checkout" }) {
  const cart = useCart();
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [addresses, setAddresses] = useState<{ id: string; zoneId: string; zoneName: string; text: string }[]>([]);
  const [saveAddress, setSaveAddress] = useState(true);
  const [pay, setPay] = useState<"online" | "on_delivery">("on_delivery");
  const { quote, customer } = cart;

  useEffect(() => {
    if (!quote.rows.length) return;
    track(mode === "cart" ? "cart_open" : "checkout_open", { items: quote.count }, quote.total);
    // Один раз при открытии оформления.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, quote.rows.length > 0]);

  useEffect(() => {
    if (mode !== "checkout") return;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then(async (data) => {
        setLoggedIn(Boolean(data.user));
        if (!data.user) return;
        if (!customer.name && data.user.name) cart.setCustomer({ name: data.user.name });
        if (!customer.phone) cart.setCustomer({ phone: data.user.phonePretty || data.user.phone });
        const list = await fetch("/api/account/addresses").then((res) => res.json());
        setAddresses(list.addresses || []);
      })
      .catch(() => undefined);
    // Контакты подставляем один раз при открытии оформления.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function submit() {
    setError("");
    if (!quote.rows.length) return;
    if (quote.belowMin) {
      setError(`Минимальный заказ в ${quote.zoneName}: ${rub(quote.minOrder)}.`);
      return;
    }
    if (customer.promo.trim() && quote.promoError) {
      setError(quote.promoError);
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: cart.lines,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          comment: customer.comment,
          promo: customer.promo,
          zoneId: cart.zoneId,
          paymentMethod: pay,
          utmSource: cart.utmSource,
          utmCampaign: cart.utmCampaign,
          attribution: attributionForOrder(),
          saveAddress: loggedIn && saveAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось оформить заказ");
      const o = data.order;
      // Главная конверсия для рекламы: заказ создан, с суммой. Оплата онлайн — отдельной целью purchase_paid на странице статуса.
      track("order_created", { order: o.number, payment: o.paymentMethod, zone: o.zoneName, promo: o.promoCode, items: o.lines.length }, o.total);
      track(o.paymentMethod === "online" ? "order_created_online" : "order_created_cod", { order: o.number }, o.total);
      cart.clear();
      if (data.order.paymentMethod === "online") router.push(`/pay/${data.order.id}`);
      else router.push(`/order/${data.order.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось оформить заказ";
      track("order_error", { reason: message.slice(0, 80) });
      setError(message);
      setPending(false);
    }
  }

  return (
    <div className="panel">
      <h2>{mode === "cart" ? "Корзина" : "Оформление заказа"}</h2>
      {error ? <div className="form-error">{error}</div> : null}
      {!quote.rows.length ? (
        <p className="empty">Пока пусто. Выберите блюдо и добавьте его в заказ.</p>
      ) : (
        quote.rows.map((row) => (
          <div className="line" key={`${row.item.id}-${row.index}`}>
            <div className="line__name">
              {row.item.name}{row.variantName ? `, ${row.variantName}` : ""}
            </div>
            <div className="line__sum">{rub(row.sum)}</div>
            {!row.item.qtyOnly && row.item.variants.length > 1 ? (
              <div className="line__vars">
                {row.item.variants.map((option) => (
                  <button
                    key={option.id}
                    className="chip"
                    type="button"
                    aria-pressed={option.id === cart.lines[row.index]?.variantId}
                    data-track="cart_variant_change"
                    data-p-item={row.item.id}
                    data-p-variant={option.id}
                    onClick={() => cart.setVariant(row.index, option.id)}
                  >
                    {option.name} · {rub(option.price)}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="line__ops">
              <div className="qty">
                <button type="button" aria-label="Меньше" data-track="cart_qty_minus" data-p-item={row.item.id} onClick={() => cart.setQty(row.index, row.qty - 1)}>−</button>
                <span>{row.qty}</span>
                <button type="button" aria-label="Больше" data-track="cart_qty_plus" data-p-item={row.item.id} onClick={() => cart.setQty(row.index, row.qty + 1)}>+</button>
              </div>
              <button className="rm" type="button" data-track="cart_remove" data-p-item={row.item.id} onClick={() => {
                ecommerce("remove", [{ id: `${row.item.id}:${cart.lines[row.index]?.variantId}`, name: row.item.name, variant: row.variantName, price: row.price, quantity: row.qty }]);
                cart.remove(row.index);
              }}>Убрать</button>
            </div>
          </div>
        ))
      )}

      <div className="fields">
        <label>
          Район доставки
          <select value={cart.zoneId} onChange={(event) => cart.setZoneId(event.target.value)} data-testid="zone" data-track="zone_select">
            {cart.zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name} · от {rub(zone.minOrder)} · доставка {zone.fee ? rub(zone.fee) : "0 ₽"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="fine">Минимум и доставка — пример. Цифры меняются в админке, без правки кода.</p>

      {quote.rows.length ? (
        <div className="totals">
          <div className="row"><span>Позиций / шт.</span><span>{quote.rows.length} / {quote.count}</span></div>
          <div className="row"><span>Блюда</span><span>{rub(quote.subtotal)}</span></div>
          {customer.promo.trim() ? (
            <div className="row"><span>Скидка</span><span>{quote.promoError ? "—" : `−${rub(quote.discount)}`}</span></div>
          ) : null}
          <div className="row"><span>Доставка</span><span>{rub(quote.deliveryFee)}</span></div>
          <div className="row grand"><span>Итого</span><span>{rub(quote.total)}</span></div>
        </div>
      ) : null}
      {quote.belowMin ? <p className="form-error">Минимальный заказ в {quote.zoneName}: {rub(quote.minOrder)}. Сейчас {rub(quote.subtotal)}.</p> : null}
      {quote.promoError ? <p className="fine">{quote.promoError}</p> : null}
      <p className="fine">Цены суши и бургеров — пример, до прайса кухни. Цены шашлыка уточняются.</p>

      {mode === "cart" ? (
        <div className="actions">
          <a className="btn btn--main" href="/checkout" data-track="cart_to_checkout" data-p-total={String(quote.total)}>К оформлению</a>
          <button className="btn btn--ghost" type="button" data-track="cart_clear" disabled={!quote.rows.length} onClick={() => cart.clear()}>Очистить</button>
        </div>
      ) : (
        <>
          {addresses.length ? (
            <div className="line__vars" style={{ marginTop: 12 }}>
              {addresses.map((address) => (
                <button
                  key={address.id}
                  className="chip"
                  type="button"
                  data-track="checkout_saved_address"
                  onClick={() => {
                    cart.setZoneId(address.zoneId);
                    cart.setCustomer({ address: address.text });
                  }}
                >
                  {address.zoneName}: {address.text}
                </button>
              ))}
            </div>
          ) : null}
          <div className="fields">
            <label>Имя<input className="ym-hide-content" value={customer.name} autoComplete="name" placeholder="Как к вам обращаться" onChange={(event) => cart.setCustomer({ name: event.target.value })} data-testid="name" data-field="name" /></label>
            <label>Телефон<input className="ym-hide-content" value={customer.phone} type="tel" autoComplete="tel" placeholder="+7 …" onChange={(event) => cart.setCustomer({ phone: event.target.value })} data-testid="phone" data-field="phone" /></label>
            <label>Адрес<input className="ym-hide-content" value={customer.address} autoComplete="street-address" placeholder="Улица, дом, подъезд" onChange={(event) => cart.setCustomer({ address: event.target.value })} data-testid="address" data-field="address" /></label>
            <label>Комментарий<textarea className="ym-hide-content" data-field="comment" value={customer.comment} placeholder="Пожелание к заказу" onChange={(event) => cart.setCustomer({ comment: event.target.value })} /></label>
            <label>Промокод<input value={customer.promo} placeholder="Если есть" onChange={(event) => cart.setCustomer({ promo: event.target.value })} data-testid="promo" data-field="promo" /></label>
          </div>
          <fieldset className="pay">
            <legend>Оплата</legend>
            <div className="pay-opts">
              <label className="pay-opt">
                <input type="radio" name="pay" value="online" data-track="pay_method_select" checked={pay === "online"} onChange={() => setPay("online")} />
                Онлайн, карта или СБП (ЮKassa)
              </label>
              <label className="pay-opt">
                <input type="radio" name="pay" value="on_delivery" data-track="pay_method_select" checked={pay === "on_delivery"} onChange={() => setPay("on_delivery")} />
                При получении, наличные или карта
              </label>
            </div>
          </fieldset>
          <p className="pay-note">
            Онлайн-оплата идёт через ЮKassa в тестовом режиме, пока не подключены боевые ключи.
            В чек по 54-ФЗ уходят позиции заказа — их проводит «Чеки от ЮKassa».
            Оплата при получении ждёт подтверждения менеджера.
          </p>
          {!loggedIn ? <p className="fine"><a href="/account/login" data-track="checkout_login_link">Войти по телефону</a>, чтобы сохранить адрес и видеть историю.</p> : (
            <label className="check">
              <input type="checkbox" data-track="checkout_save_address" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} />
              Сохранить адрес в кабинете
            </label>
          )}
          <div className="actions">
            <button className="btn btn--main" type="button" disabled={!quote.rows.length || pending || quote.belowMin} onClick={submit} data-testid="submit" data-track="order_submit" data-p-payment={pay} data-p-total={String(quote.total)}>
              {pay === "online" ? "Перейти к оплате" : "Отправить заявку"}
            </button>
            <button className="btn btn--ghost" type="button" data-track="checkout_clear" disabled={!quote.rows.length || pending} onClick={() => cart.clear()}>Очистить</button>
          </div>
          {(cart.utmSource || cart.utmCampaign) ? (
            <p className="fine">Источник: {[cart.utmSource, cart.utmCampaign].filter(Boolean).join(" / ")}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
