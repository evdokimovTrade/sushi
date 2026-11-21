import { fail, ok } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return fail("Войдите по телефону", 401);
  const { id } = await context.params;
  await prisma.address.deleteMany({ where: { id, userId: user.id } });
  return ok({ ok: true });
}
