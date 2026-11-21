import { fail, ok } from "@/lib/http";
import { createOrder, orderPublic, type IncomingLine } from "@/lib/orders";
import { getUserSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    lines?: IncomingLine[];
    name?: string;
    phone?: string;
    address?: string;
    comment?: string;
    promo?: string;
    zoneId?: string;
    paymentMethod?: "online" | "on_delivery";
    utmSource?: string;
    utmCampaign?: string;
    saveAddress?: boolean;
  } | null;
  if (!body) return fail("Пустой запрос");
  try {
    const session = await getUserSession();
    const result = await createOrder({
      lines: body.lines || [],
      name: body.name || "",
      phone: body.phone || "",
      address: body.address || "",
      comment: body.comment || "",
      promo: body.promo || "",
      zoneId: body.zoneId || "",
      paymentMethod: body.paymentMethod || "on_delivery",
      utmSource: body.utmSource || "",
      utmCampaign: body.utmCampaign || "",
      saveAddress: Boolean(body.saveAddress),
      userId: session?.user?.id || null,
    });
    return ok({
      order: orderPublic(result.order),
      confirmationUrl: result.confirmationUrl,
      paymentMode: result.paymentMode,
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Не удалось оформить заказ");
  }
}
