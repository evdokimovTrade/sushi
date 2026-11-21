import { createSession, safeEqual } from "@/lib/auth";
import { ADMIN_COOKIE, cookieOptions, fail } from "@/lib/http";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const expected = process.env.ADMIN_PASSWORD || "";
  const password = body?.password || "";
  if (!expected || !password || !safeEqual(password, expected)) return fail("Неверный пароль", 401);
  const token = await createSession("admin");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, cookieOptions(60 * 60 * 24 * 7));
  return res;
}
