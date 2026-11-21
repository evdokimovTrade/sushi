import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, cookieOptions, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { token } });
  const res = ok({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", cookieOptions(0));
  return res;
}
