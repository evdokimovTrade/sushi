"use client";

import { reopenConsent } from "@/lib/consent";

export function CookieSettingsLink() {
  return <a href="#cookie" onClick={(e) => { e.preventDefault(); reopenConsent(); }} data-track-off>Настройки cookie</a>;
}
