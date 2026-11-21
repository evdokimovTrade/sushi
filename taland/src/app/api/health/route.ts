import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/http";
import { paymentMode } from "@/lib/yookassa";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await prisma.menuItem.count();
  return ok({ ok: true, items, payment: paymentMode(), auth: process.env.AUTH_MODE || "dev" });
}
