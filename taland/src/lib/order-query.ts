import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export function orderFilters(url: URL) {
  const status = url.searchParams.get("status") || "";
  const pay = url.searchParams.get("pay") || "";
  const source = (url.searchParams.get("source") || "").trim();
  const promo = (url.searchParams.get("promo") || "").trim();
  const q = (url.searchParams.get("q") || "").trim();
  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;
  if (pay) where.paymentMethod = pay;
  if (source) where.utmSource = { contains: source };
  if (promo) where.promoCode = { contains: promo.toUpperCase() };
  if (q) {
    const digits = q.replace(/\D/g, "");
    const or: Prisma.OrderWhereInput[] = [{ number: { contains: q } }, { name: { contains: q } }];
    if (digits.length >= 3) or.push({ phone: { contains: digits } });
    where.OR = or;
  }
  return where;
}

export function listOrders(where: Prisma.OrderWhereInput) {
  return prisma.order.findMany({
    where,
    include: { lines: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
