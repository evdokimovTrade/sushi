export function normalizePhone(input: string) {
  let d = String(input || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("8")) d = "7" + d.slice(1);
  if (d.length === 10) d = "7" + d;
  if (d.length !== 11 || !d.startsWith("7")) return null;
  return d;
}

export function formatPhone(d: string) {
  const p = normalizePhone(d);
  if (!p) return d;
  return `+${p[0]} ${p.slice(1, 4)} ${p.slice(4, 7)}-${p.slice(7, 9)}-${p.slice(9, 11)}`;
}
