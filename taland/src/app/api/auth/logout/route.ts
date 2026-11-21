import { prisma } from "@/lib/prisma";
import { cookieOptions, ok, USER_COOKIE } from "@/lib/http";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(USER_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { token } });
  const res = ok({ ok: true });
  res.cookies.set(USER_COOKIE, "", cookieOptions(0));
  return res;
}
