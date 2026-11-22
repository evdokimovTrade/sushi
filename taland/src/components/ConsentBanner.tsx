"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { OPEN_EVENT, getConsent, setConsent } from "@/lib/consent";

export function ConsentBanner() {
  const path = usePathname() || "/";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (path.startsWith("/admin")) return;
    setOpen(getConsent() === null);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, [path]);

  if (!open) return null;
  return (
    <div className="consent" role="dialog" aria-label="Cookie и аналитика" data-track-off>
      <p>
        Мы используем cookie и сервисы аналитики (Яндекс Метрика, VK Реклама), чтобы понимать, что работает на сайте.
        Корзина и заказ работают и без них. <a href="/legal/privacy">Подробнее</a>
      </p>
      <div className="consent__actions">
        <button className="btn btn--main" type="button" data-testid="consent-all" onClick={() => { setConsent("all"); setOpen(false); }}>Принять</button>
        <button className="btn btn--ghost" type="button" data-testid="consent-necessary" onClick={() => { setConsent("necessary"); setOpen(false); }}>Только необходимые</button>
      </div>
    </div>
  );
}
