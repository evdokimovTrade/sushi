import { ok } from "@/lib/http";
import { getUserSession } from "@/lib/auth";
import { formatPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getUserSession();
  if (!session?.user) return ok({ user: null });
  return ok({
    user: {
      id: session.user.id,
      phone: session.user.phone,
      phonePretty: formatPhone(session.user.phone),
      name: session.user.name,
    },
  });
}
