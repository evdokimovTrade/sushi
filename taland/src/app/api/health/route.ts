import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/http";
import { paymentMode } from "@/lib/yookassa";
import { outboxState } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await prisma.menuItem.count();
  // sheets: сколько ждёт отправки в Google Таблицу и когда была последняя отправка (без адресов и ключей).
  const sheets = await outboxState();
  return ok({ ok: true, items, payment: paymentMode(), auth: process.env.AUTH_MODE || "dev", sheets });
}
