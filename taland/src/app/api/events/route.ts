import { prisma } from "@/lib/prisma";
import { enqueueEvents } from "@/lib/sheets";

export const dynamic = "force-dynamic";

type Incoming = { goal?: unknown; page?: unknown; label?: unknown; params?: unknown; value?: unknown; t?: unknown };

const s = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const hits = new Map<string, { n: number; at: number }>();

/** Пачка событий из браузера (sendBeacon). До 50 за раз, простое ограничение частоты по IP. */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const h = hits.get(ip);
  if (h && now - h.at < 60000 && h.n > 120) return new Response(null, { status: 429 });
  hits.set(ip, h && now - h.at < 60000 ? { n: h.n + 1, at: h.at } : { n: 1, at: now });
  if (hits.size > 5000) hits.clear();

  const body = (await request.json().catch(() => null)) as { session?: unknown; source?: unknown; campaign?: unknown; events?: Incoming[] } | null;
  if (!body || !Array.isArray(body.events)) return new Response(null, { status: 400 });
  const session = s(body.session, 40) || "—";
  const source = s(body.source, 80);
  const campaign = s(body.campaign, 80);
  const rows = body.events.slice(0, 50).map((e) => {
    const goal = s(e.goal, 60).replace(/[^\w:.-]/g, "");
    const value = typeof e.value === "number" && Number.isFinite(e.value) ? Math.round(e.value) : null;
    let params = "";
    if (e.params && typeof e.params === "object") params = JSON.stringify(e.params).slice(0, 500);
    const at = typeof e.t === "number" && Math.abs(Date.now() - e.t) < 6 * 3600_000 ? new Date(e.t) : new Date();
    return { at, session, goal, page: s(e.page, 120), label: s(e.label, 80), params, value, source, campaign };
  }).filter((r) => r.goal);
  if (!rows.length) return new Response(null, { status: 204 });
  await prisma.siteEvent.createMany({ data: rows });
  await enqueueEvents(rows.map((r) => ({ ...r, at: r.at.toISOString() })));
  return new Response(null, { status: 204 });
}
