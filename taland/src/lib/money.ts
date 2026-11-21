export function rub(n: number) {
  const v = Math.round(n);
  return v.toLocaleString("ru-RU").replace(/\u00a0/g, " ") + " ₽";
}

export function formatMoscow(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function makeOrderNumber(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const ymd = parts.slice(2).replace(/-/g, "");
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `TLD-${ymd}-${rand}`;
}
