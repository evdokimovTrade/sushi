import crypto from "crypto";
import { prisma } from "./prisma";
import { normalizePhone } from "./phone";
import { calcDiscount } from "./pricing";
import { paymentMode, createYookassaPayment } from "./yookassa";

export type IncomingLine = { itemId: string; variantId: string; qty: number };

export type CreateOrderInput = {
  lines: IncomingLine[];
  name: string;
  phone: string;
  address: string;
  comment: string;
  promo: string;
  zoneId: string;
  paymentMethod: "online" | "on_delivery";
  utmSource: string;
  utmCampaign: string;
  saveAddress: boolean;
  userId?: string | null;
};

function clip(value: string, max: number) {
  return value.trim().slice(0, max);
}

function makeNumber() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const ymd = parts.slice(2).replace(/-/g, "");
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `TLD-${ymd}-${rand}`;
}

export async function createOrder(input: CreateOrderInput) {
  const phone = normalizePhone(input.phone);
  if (!phone) throw new Error("Укажите телефон в формате +7");
  const name = clip(input.name, 80);
  const address = clip(input.address, 200);
  const comment = clip(input.comment, 500);
  if (name.length < 2) throw new Error("Как к вам обращаться?");
  if (address.length < 5) throw new Error("Укажите адрес: улица, дом, подъезд");
  if (input.paymentMethod !== "online" && input.paymentMethod !== "on_delivery") {
    throw new Error("Выберите способ оплаты");
  }
  if (!Array.isArray(input.lines) || input.lines.length === 0) throw new Error("Корзина пуста");
  if (input.lines.length > 40) throw new Error("Слишком много позиций");

  const zone = await prisma.deliveryZone.findFirst({ where: { id: input.zoneId, active: true } });
  if (!zone) throw new Error("Выберите район доставки");

  const itemIds = [...new Set(input.lines.map((l) => l.itemId))];
  const items = await prisma.menuItem.findMany({
    where: { id: { in: itemIds }, active: true },
    include: { variants: { where: { active: true } } },
  });
  const byId = new Map(items.map((item) => [item.id, item]));

  const priced: {
    itemId: string;
    itemName: string;
    variantId: string;
    variantName: string;
    qty: number;
    price: number;
    sum: number;
  }[] = [];

  for (const line of input.lines) {
    const qty = Math.floor(Number(line.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > 99) throw new Error("Проверьте количество");
    const item = byId.get(line.itemId);
    if (!item) throw new Error("В корзине есть блюдо, которого уже нет в меню");
    const variant = item.variants.find((v) => v.id === line.variantId);
    if (!variant) throw new Error(`Вариант «${item.name}» недоступен`);
    const same = priced.find((p) => p.itemId === item.id && p.variantId === variant.id);
    if (same) {
      same.qty += qty;
      same.sum = same.price * same.qty;
    } else {
      priced.push({
        itemId: item.id,
        itemName: item.name,
        variantId: variant.id,
        variantName: item.qtyOnly ? "" : variant.name,
        qty,
        price: variant.price,
        sum: variant.price * qty,
      });
    }
  }

  const subtotal = priced.reduce((s, line) => s + line.sum, 0);
  let discount = 0;
  let promoCode = "";
  const code = clip(input.promo, 40).toUpperCase();
  if (code) {
    const promo = await prisma.promoCode.findUnique({ where: { code } });
    if (!promo || !promo.active) throw new Error("Промокод не найден");
    const result = calcDiscount(subtotal, {
      type: promo.type,
      value: promo.value,
      minOrder: promo.minOrder,
      active: promo.active,
      expiresAt: promo.expiresAt ? promo.expiresAt.toISOString() : null,
    });
    if (result.error) throw new Error(result.error);
    discount = result.discount;
    promoCode = promo.code;
  }

  if (subtotal < zone.minOrder) {
    throw new Error(`Минимальный заказ в ${zone.name}: ${zone.minOrder} ₽. Сейчас ${subtotal} ₽.`);
  }

  const deliveryFee = zone.fee;
  const total = subtotal - discount + deliveryFee;
  const online = input.paymentMethod === "online";
  const mode = online ? paymentMode() : "none";
  if (online && mode === "blocked") {
    throw new Error("Онлайн-оплата сейчас недоступна. Можно оформить заказ с оплатой при получении.");
  }

  const status = online ? "awaiting_payment" : "awaiting_confirmation";
  const paymentStatus = online ? "pending" : "unpaid";

  let order = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      order = await prisma.order.create({
        data: {
          number: makeNumber(),
          userId: input.userId || null,
          name,
          phone,
          address,
          zoneId: zone.id,
          zoneName: zone.name,
          comment,
          promoCode,
          discount,
          deliveryFee,
          subtotal,
          total,
          paymentMethod: input.paymentMethod,
          paymentStatus,
          status,
          utmSource: clip(input.utmSource, 80),
          utmCampaign: clip(input.utmCampaign, 80),
          paymentMode: online ? mode : "",
          lines: { create: priced },
        },
        include: { lines: true },
      });
      break;
    } catch (error) {
      const codeName = (error as { code?: string }).code;
      if (codeName === "P2002" && attempt < 4) continue;
      throw error;
    }
  }
  if (!order) throw new Error("Не удалось сохранить заказ");

  if (input.userId) {
    if (input.saveAddress) {
      const text = address;
      const existing = await prisma.address.findFirst({ where: { userId: input.userId, zoneId: zone.id, text } });
      if (!existing) {
        await prisma.address.create({ data: { userId: input.userId, zoneId: zone.id, text } });
        const all = await prisma.address.findMany({
          where: { userId: input.userId },
          orderBy: { createdAt: "desc" },
        });
        const extra = all.slice(8);
        if (extra.length) {
          await prisma.address.deleteMany({ where: { id: { in: extra.map((a) => a.id) } } });
        }
      }
    }
    await prisma.user.update({
      where: { id: input.userId },
      data: { name: name || undefined },
    }).catch(() => undefined);
  }

  let confirmationUrl = "";
  let paidImmediately = false;
  if (online && mode === "yookassa") {
    if (total <= 0) {
      paidImmediately = true;
    } else {
      try {
        const payment = await createYookassaPayment(order);
        confirmationUrl = payment.confirmationUrl;
        paidImmediately = payment.paidImmediately;
        await prisma.order.update({
          where: { id: order.id },
          data: { yookassaId: payment.id, confirmationUrl },
        });
      } catch {
        confirmationUrl = "";
      }
    }
  }
  if (online && (paidImmediately || (mode === "yookassa" && total <= 0))) {
    await markOrderPaid(order.id);
  }

  const fresh = await prisma.order.findUnique({ where: { id: order.id }, include: { lines: true } });
  return { order: fresh!, confirmationUrl, paymentMode: online ? mode : "none" };
}

export async function markOrderPaid(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  if (order.status !== "cancelled" && !(order.paymentStatus === "paid" && order.status !== "awaiting_payment")) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "paid",
        status: order.status === "awaiting_payment" ? "kitchen" : order.status,
      },
    });
  }
  return prisma.order.findUnique({ where: { id: orderId }, include: { lines: true } });
}

export function orderPublic(order: {
  id: string;
  number: string;
  createdAt: Date;
  name: string;
  phone: string;
  address: string;
  zoneName: string;
  comment: string;
  promoCode: string;
  discount: number;
  deliveryFee: number;
  subtotal: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  utmSource: string;
  utmCampaign: string;
  paymentMode: string;
  confirmationUrl: string;
  lines: { itemId: string; itemName: string; variantId: string; variantName: string; qty: number; price: number; sum: number }[];
}) {
  return {
    id: order.id,
    number: order.number,
    createdAt: order.createdAt.toISOString(),
    name: order.name,
    phone: order.phone,
    address: order.address,
    zoneName: order.zoneName,
    comment: order.comment,
    promoCode: order.promoCode,
    discount: order.discount,
    deliveryFee: order.deliveryFee,
    subtotal: order.subtotal,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    utmSource: order.utmSource,
    utmCampaign: order.utmCampaign,
    paymentMode: order.paymentMode,
    confirmationUrl: order.confirmationUrl,
    lines: order.lines.map((line) => ({
      itemId: line.itemId,
      itemName: line.itemName,
      variantId: line.variantId,
      variantName: line.variantName,
      qty: line.qty,
      price: line.price,
      sum: line.sum,
    })),
  };
}
