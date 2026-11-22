"use client";

/**
 * Согласие на cookie и аналитику. Пока посетитель не нажал «Принять», Метрика, пиксель VK, GA4
 * и копия кликов на сервер не работают. «Только необходимые» — корзина, заказ, вход работают, аналитики нет.
 */

export type Consent = "all" | "necessary" | null;
const KEY = "taland_consent_v1";
const EVENT = "taland-consent";

export function getConsent(): Consent {
  try {
    const v = localStorage.getItem(KEY);
    return v === "all" || v === "necessary" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: Exclude<Consent, null>) {
  try {
    localStorage.setItem(KEY, value);
    localStorage.setItem(`${KEY}_at`, new Date().toISOString());
  } catch { /* без хранилища баннер покажется снова — это безопасно */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
}

export function analyticsAllowed() {
  return getConsent() === "all";
}

export function onConsent(fn: (value: Consent) => void) {
  const handler = (e: Event) => fn((e as CustomEvent).detail as Consent);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

/** Открыть баннер снова (ссылка «Настройки cookie» в подвале). */
export function reopenConsent() {
  window.dispatchEvent(new CustomEvent(`${EVENT}-open`));
}
export const OPEN_EVENT = `${EVENT}-open`;
