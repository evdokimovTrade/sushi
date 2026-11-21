import { fail, ok } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orderPublic } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (!user) return fail("Войдите по телефону", 401);
  const orders = await prisma.order.findMany({
    where: { OR: [{ userId: user.id }, { phone: user.phone }] },
    include: { lines: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return ok({ orders: orders.map(orderPublic) });
}
