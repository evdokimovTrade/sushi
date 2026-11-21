import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/http";
import { normalizePhone } from "@/lib/phone";
import { getSmsSender } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { phone?: string } | null;
  const phone = normalizePhone(body?.phone || "");
  if (!phone) return fail("Укажите телефон в формате +7");
  const since = new Date(Date.now() - 10 * 60 * 1000);
  const recent = await prisma.otpCode.count({ where: { phone, createdAt: { gt: since } } });
  if (recent >= 5) return fail("Слишком много кодов. Подождите несколько минут.", 429);

  const fixed = (process.env.DEV_OTP_CODE || "").trim();
  const code = /^\d{4}$/.test(fixed) ? fixed : String(crypto.randomInt(0, 10000)).padStart(4, "0");
  const devMode = (process.env.AUTH_MODE || "dev") !== "sms";
  await prisma.otpCode.updateMany({ where: { phone, used: false }, data: { used: true } });
  await prisma.otpCode.create({
    data: { phone, code, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
  });

  if (!devMode) {
    try {
      const sms = getSmsSender();
      await sms.send(phone, `ТаланД: код входа ${code}`);
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Не удалось отправить SMS", 503);
    }
    return ok({ sent: true, dev: false });
  }
  return ok({ sent: true, dev: true, devCode: code });
}
