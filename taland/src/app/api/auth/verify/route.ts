import { prisma } from "@/lib/prisma";
import { cookieOptions, fail, ok, USER_COOKIE } from "@/lib/http";
import { normalizePhone } from "@/lib/phone";
import { createSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { phone?: string; code?: string } | null;
  const phone = normalizePhone(body?.phone || "");
  const code = String(body?.code || "").replace(/\D/g, "");
  if (!phone || code.length !== 4) return fail("Введите телефон и код из 4 цифр");
  const otp = await prisma.otpCode.findFirst({
    where: { phone, used: false },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.expiresAt.getTime() < Date.now()) return fail("Код устарел. Запросите новый.");
  if (otp.attempts >= 5) return fail("Слишком много попыток. Запросите новый код.");
  if (otp.code !== code) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return fail("Неверный код");
  }
  await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });
  const user = await prisma.user.upsert({
    where: { phone },
    create: { phone },
    update: {},
  });
  await prisma.order.updateMany({ where: { phone, userId: null }, data: { userId: user.id } });
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const token = await createSession("user", user.id);
  const res = NextResponse.json({
    user: { id: user.id, phone: user.phone, name: user.name },
  });
  res.cookies.set(USER_COOKIE, token, cookieOptions(60 * 60 * 24 * 30));
  return res;
}
