import crypto from "crypto";
import { buildReceiptItems, type ReceiptInputLine } from "./receipt";

export type PaymentMode = "yookassa" | "mock" | "blocked";

export function paymentMode(): PaymentMode {
  const shopId = (process.env.YOOKASSA_SHOP_ID || "").trim();
  const secret = (process.env.YOOKASSA_SECRET_KEY || "").trim();
  const testMode = (process.env.YOOKASSA_TEST_MODE ?? "true") !== "false";
  const allowLive = process.env.YOOKASSA_ALLOW_LIVE === "true";
  if (shopId && secret) {
    if (!testMode && !allowLive) return "blocked";
    return "yookassa";
  }
  if (process.env.ALLOW_MOCK_PAYMENTS === "false") return "blocked";
  return "mock";
}

export function yookassaConfigured() {
  return Boolean((process.env.YOOKASSA_SHOP_ID || "").trim() && (process.env.YOOKASSA_SECRET_KEY || "").trim());
}

function authHeader() {
  const shopId = (process.env.YOOKASSA_SHOP_ID || "").trim();
  const secret = (process.env.YOOKASSA_SECRET_KEY || "").trim();
  return "Basic " + Buffer.from(`${shopId}:${secret}`).toString("base64");
}

export function publicBaseUrl() {
  return (process.env.PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}

type OrderForPay = {
  id: string;
  number: string;
  phone: string;
  total: number;
  discount: number;
  deliveryFee: number;
  lines: { itemName: string; variantName: string; qty: number; sum: number }[];
};

export function receiptPayload(order: OrderForPay) {
  const vatCode = Number(process.env.YOOKASSA_VAT_CODE || "1");
  const paymentModeValue = process.env.YOOKASSA_PAYMENT_MODE || "full_prepayment";
  const lines: ReceiptInputLine[] = order.lines.map((line) => {
    const variant = line.variantName && line.variantName !== line.itemName ? `, ${line.variantName}` : "";
    return { name: `${line.itemName}${variant}`, qty: line.qty, sum: line.sum };
  });
  const built = buildReceiptItems({
    lines,
    discount: order.discount,
    deliveryFee: order.deliveryFee,
    vatCode: Number.isFinite(vatCode) ? vatCode : 1,
    paymentMode: paymentModeValue,
  });
  const customerPhone = order.phone.replace(/\D/g, "");
  const receipt: Record<string, unknown> = {
    customer: { phone: customerPhone },
    items: built.items,
  };
  if ((process.env.YOOKASSA_RECEIPT_INTERNET ?? "true") !== "false") receipt.internet = "true";
  const tax = (process.env.YOOKASSA_TAX_SYSTEM_CODE || "").trim();
  if (tax) receipt.tax_system_code = Number(tax);
  return { receipt, total: built.total };
}

export async function createYookassaPayment(order: OrderForPay) {
  if (paymentMode() !== "yookassa") throw new Error("ЮKassa не настроена");
  if ((order.total).toFixed(2) === "0.00") {
    return { id: "", confirmationUrl: "", paidImmediately: true };
  }
  const body: Record<string, unknown> = {
    amount: { value: order.total.toFixed(2), currency: "RUB" },
    capture: true,
    confirmation: {
      type: "redirect",
      return_url: `${publicBaseUrl()}/pay/${order.id}?return=1`,
    },
    description: `Заказ ${order.number}`.slice(0, 128),
    metadata: { orderId: order.id, number: order.number },
  };
  if ((process.env.YOOKASSA_SEND_RECEIPT ?? "true") !== "false") {
    const { receipt, total } = receiptPayload(order);
    if (total !== order.total.toFixed(2)) {
      throw new Error("Сумма чека не совпала с суммой заказа");
    }
    body.receipt = receipt;
  }
  const res = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Idempotence-Key": crypto.randomUUID(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    id?: string;
    confirmation?: { confirmation_url?: string };
    description?: string;
    type?: string;
  };
  if (!res.ok || !data.id) {
    const message = data.description || "ЮKassa не создала платёж";
    throw new Error(message);
  }
  return {
    id: data.id,
    confirmationUrl: data.confirmation?.confirmation_url || "",
    paidImmediately: false,
  };
}

export async function fetchYookassaPayment(paymentId: string) {
  if (!yookassaConfigured() || !paymentId) return null;
  const res = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as { id: string; status: string; paid?: boolean; metadata?: { orderId?: string } };
}
