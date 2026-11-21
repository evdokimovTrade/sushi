"use client";

/**
 * Метрики для рекламы: Яндекс Метрика (цели + электронная коммерция), VK Реклама (пиксель Top.Mail.Ru), GA4 — по желанию.
 * Номера счётчиков — в .env (NEXT_PUBLIC_YM_ID, NEXT_PUBLIC_VK_PIXEL_ID, NEXT_PUBLIC_GA4_ID). Пусто — счётчик не грузится,
 * события всё равно пишутся в window.__talandEvents (проверка без счётчиков: ?debug_metrics=1 печатает их в консоль).
 * Полный список целей — METRICS.md.
 */

export const YM_ID = Number(process.env.NEXT_PUBLIC_YM_ID || 0) || 0;
export const VK_ID = process.env.NEXT_PUBLIC_VK_PIXEL_ID || "";
export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || "";

type Params = Record<string, string | number | boolean | undefined>;
export type EcomProduct = { id: string; name: string; category?: string; variant?: string; price: number; quantity: number };

type W = Window & {
  ym?: (...args: unknown[]) => void;
  _tmr?: unknown[];
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
  __talandEvents?: { t: number; goal: string; params?: Params }[];
};

const ATTR_KEY = "taland_attr_v1";
const ATTR_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "yclid", "gclid", "rb_clickid", "vk_click_id", "promo"];

function w(): W | null {
  return typeof window === "undefined" ? null : (window as W);
}

function clean(params?: Params): Params | undefined {
  if (!params) return undefined;
  const out: Params = {};
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") out[k] = v;
  return out;
}

function debug() {
  try {
    return localStorage.getItem("taland_debug_metrics") === "1";
  } catch {
    return false;
  }
}

/** Цель во все подключённые счётчики. value — деньги в рублях (для заказа и корзины). */
export function track(goal: string, params?: Params, value?: number) {
  const win = w();
  if (!win) return;
  const p = clean(params);
  (win.__talandEvents = win.__talandEvents || []).push({ t: Date.now(), goal, params: p });
  if (win.__talandEvents.length > 500) win.__talandEvents.shift();
  // Журнал за сессию — переживает переходы со страницы на страницу (проверка целей владельцем и тестами).
  try {
    const log = JSON.parse(sessionStorage.getItem("taland_metrics_log") || "[]");
    log.push([goal, p || {}, value ?? null]);
    sessionStorage.setItem("taland_metrics_log", JSON.stringify(log.slice(-300)));
  } catch { /* */ }
  if (debug()) console.info("[metrics]", goal, p || "", value ?? "");
  try {
    if (YM_ID && win.ym) win.ym(YM_ID, "reachGoal", goal, value !== undefined ? { ...p, order_price: value, currency: "RUB" } : p);
  } catch { /* счётчик не должен ломать сайт */ }
  try {
    if (VK_ID) (win._tmr = win._tmr || []).push({ type: "reachGoal", id: VK_ID, goal, ...(value !== undefined ? { value } : {}), params: p });
  } catch { /* */ }
  try {
    if (GA4_ID && win.gtag) win.gtag("event", goal, value !== undefined ? { ...p, value, currency: "RUB" } : p);
  } catch { /* */ }
}

/** Электронная коммерция Метрики (dataLayer) + аналог GA4. action: detail | add | remove | purchase. */
export function ecommerce(action: "detail" | "add" | "remove" | "purchase", products: EcomProduct[], order?: { id: string; revenue: number; coupon?: string }) {
  const win = w();
  if (!win || !products.length) return;
  const payload: Record<string, unknown> = { products };
  if (action === "purchase" && order) payload.actionField = { id: order.id, revenue: order.revenue, coupon: order.coupon || undefined };
  (win.dataLayer = win.dataLayer || []).push({ ecommerce: { currencyCode: "RUB", [action]: payload } });
  try {
    const log = JSON.parse(sessionStorage.getItem("taland_metrics_log") || "[]");
    log.push([`ecommerce:${action}`, { products: products.length, revenue: order?.revenue }, null]);
    sessionStorage.setItem("taland_metrics_log", JSON.stringify(log.slice(-300)));
  } catch { /* */ }
  if (debug()) console.info("[ecommerce]", action, payload);
  try {
    if (GA4_ID && win.gtag) {
      const map = { detail: "view_item", add: "add_to_cart", remove: "remove_from_cart", purchase: "purchase" } as const;
      const items = products.map((p) => ({ item_id: p.id, item_name: p.name, item_category: p.category, item_variant: p.variant, price: p.price, quantity: p.quantity }));
      const value = products.reduce((s, p) => s + p.price * p.quantity, 0);
      win.gtag("event", map[action], { currency: "RUB", value: order?.revenue ?? value, transaction_id: order?.id, coupon: order?.coupon, items });
    }
  } catch { /* */ }
}

export function pageView(url: string) {
  const win = w();
  if (!win) return;
  try { if (YM_ID && win.ym) win.ym(YM_ID, "hit", url, { referer: document.referrer }); } catch { /* */ }
  try { if (VK_ID) (win._tmr = win._tmr || []).push({ id: VK_ID, type: "pageView", start: Date.now() }); } catch { /* */ }
  try { if (GA4_ID && win.gtag) win.gtag("event", "page_view", { page_location: url }); } catch { /* */ }
}

/** Запоминает метки рекламы при входе на сайт: первая и последняя. Уходит в заказ — для офлайн-конверсий в кабинетах. */
export function captureAttribution() {
  const win = w();
  if (!win) return;
  try {
    const q = new URLSearchParams(win.location.search);
    const current: Record<string, string> = {};
    for (const key of ATTR_PARAMS) {
      const v = q.get(key);
      if (v) current[key] = v.slice(0, 120);
    }
    const stored = JSON.parse(localStorage.getItem(ATTR_KEY) || "{}");
    if (Object.keys(current).length) {
      current.landing = (win.location.pathname + win.location.search).slice(0, 200);
      current.at = new Date().toISOString();
      if (!stored.first) stored.first = current;
      stored.last = current;
    }
    if (!stored.referrer && document.referrer && !document.referrer.includes(win.location.host)) stored.referrer = document.referrer.slice(0, 200);
    localStorage.setItem(ATTR_KEY, JSON.stringify(stored));
    if (debug() || q.get("debug_metrics") === "1") localStorage.setItem("taland_debug_metrics", "1");
  } catch { /* */ }
}

/** Всё, что уходит в заказ: первое и последнее касание, реферер, ClientID Метрики. */
export function attributionForOrder(): string {
  try {
    const stored = JSON.parse(localStorage.getItem(ATTR_KEY) || "{}");
    stored.ym_client_id = localStorage.getItem("taland_ym_client_id") || "";
    return JSON.stringify(stored).slice(0, 2000);
  } catch {
    return "";
  }
}

/** Цель один раз за сессию браузера (промокод проверяется при каждой загрузке страницы — без этого цель повторялась бы). */
export function oncePerSession(key: string, fn: () => void) {
  try {
    const k = `taland_s_${key}`;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
  } catch { /* */ }
  fn();
}

/** Цель покупки один раз на заказ, даже если страница статуса обновляется. */
export function once(key: string, fn: () => void) {
  try {
    const k = `taland_once_${key}`;
    if (localStorage.getItem(k)) return;
    localStorage.setItem(k, "1");
  } catch { /* без хранилища — отправим, лучше дубль, чем потеря */ }
  fn();
}
