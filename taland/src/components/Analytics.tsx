"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { GA4_ID, VK_ID, YM_ID, captureAttribution, pageView, track } from "@/lib/analytics";
import { analyticsAllowed, onConsent } from "@/lib/consent";

type Win = Window & { ym?: (...a: unknown[]) => void; dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void };

function addScript(src: string, id: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  s.id = id;
  document.head.appendChild(s);
}

function loadCounters() {
  const win = window as Win;
  if (YM_ID && !win.ym) {
    const ym = function (...args: unknown[]) { ((ym as unknown as { a: unknown[] }).a = (ym as unknown as { a: unknown[] }).a || []).push(args); };
    (ym as unknown as { l: number }).l = Date.now();
    win.ym = ym;
    win.dataLayer = win.dataLayer || [];
    addScript("https://mc.yandex.ru/metrika/tag.js", "ym-tag");
    // defer: true — просмотры страниц шлём сами при каждом переходе (сайт одностраничный).
    win.ym(YM_ID, "init", { defer: true, clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true, ecommerce: "dataLayer" });
    win.ym(YM_ID, "getClientID", (id: string) => { try { localStorage.setItem("taland_ym_client_id", id); } catch { /* */ } });
  }
  if (VK_ID) addScript("https://top-fwz1.mail.ru/js/code.js", "tmr-code");
  if (GA4_ID && !win.gtag) {
    win.dataLayer = win.dataLayer || [];
    win.gtag = function (...args: unknown[]) { (win.dataLayer as unknown[]).push(args); };
    win.gtag("js", new Date());
    win.gtag("config", GA4_ID, { send_page_view: false });
    addScript(`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`, "ga4-tag");
  }
}

function label(el: Element) {
  const own = el.getAttribute("aria-label") || (el as HTMLElement).innerText || el.getAttribute("title") || "";
  return own.replace(/\s+/g, " ").trim().slice(0, 60);
}

/** data-p-item="phila" → {item: "phila"}. */
function extra(el: Element) {
  const out: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) if (attr.name.startsWith("data-p-")) out[attr.name.slice(7)] = attr.value;
  return out;
}

const CLICKABLE = "[data-track],button,a,[role=button],summary";

export function Analytics() {
  const path = usePathname() || "/";
  const staff = path.startsWith("/admin");

  useEffect(() => {
    if (staff) return;
    captureAttribution();
    // Счётчики грузятся только после «Принять» в баннере cookie.
    if (analyticsAllowed()) loadCounters();
    const offConsent = onConsent((value) => {
      if (value === "all") { loadCounters(); pageView(window.location.href); }
    });
    // Каждый клик по кнопке или ссылке: своё имя цели из data-track, остальное — общая цель ui_click с подписью.
    const onClick = (event: MouseEvent) => {
      const el = (event.target as Element | null)?.closest?.(CLICKABLE);
      if (!el || el.closest("[data-track-off]")) return;
      const goal = el.getAttribute("data-track") || "ui_click";
      if (el.getAttribute("data-track-on") === "change") return;
      track(goal, { label: label(el), page: window.location.pathname, ...extra(el) });
    };
    // Выбор в списках, переключателях и флажках.
    const onChange = (event: Event) => {
      const el = event.target as HTMLInputElement | HTMLSelectElement | null;
      if (!el || !el.getAttribute) return;
      const goal = el.getAttribute("data-track");
      if (!goal) return;
      const value = el instanceof HTMLInputElement && el.type === "checkbox" ? String(el.checked) : el.value;
      track(goal, { value: value.slice(0, 60), page: window.location.pathname, ...extra(el) });
    };
    // Начало заполнения формы — один раз за визит на поле.
    const touched = new Set<string>();
    const onFocus = (event: FocusEvent) => {
      const el = event.target as HTMLElement | null;
      const name = el?.getAttribute?.("data-field");
      if (!name || touched.has(name)) return;
      touched.add(name);
      track("form_field_start", { field: name, page: window.location.pathname });
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("change", onChange, true);
    document.addEventListener("focusin", onFocus, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("change", onChange, true);
      document.removeEventListener("focusin", onFocus, true);
      offConsent();
    };
  }, [staff]);

  useEffect(() => {
    if (staff) return;
    pageView(window.location.href);
  }, [path, staff]);

  return null;
}
