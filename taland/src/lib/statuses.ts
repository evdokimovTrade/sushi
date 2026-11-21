export const STATUS_LABEL: Record<string, string> = {
  awaiting_payment: "Ожидает оплаты",
  awaiting_confirmation: "Ожидает подтверждения менеджера",
  confirmed: "Подтверждён",
  kitchen: "На кухне",
  ready: "Готов",
  courier: "У курьера",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export const NEXT_STATUS: Record<string, string[]> = {
  awaiting_payment: ["cancelled"],
  awaiting_confirmation: ["confirmed", "cancelled"],
  confirmed: ["kitchen", "cancelled"],
  kitchen: ["ready", "cancelled"],
  ready: ["courier", "cancelled"],
  courier: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export const STATUS_ACTION: Record<string, string> = {
  confirmed: "Подтвердить",
  kitchen: "На кухню",
  ready: "Готово",
  courier: "Курьеру",
  delivered: "Доставлен",
  cancelled: "Отменить",
};

export const PAYMENT_LABEL: Record<string, string> = {
  online: "Онлайн (ЮKassa)",
  on_delivery: "При получении",
};

export function formatSource(source: string, campaign: string) {
  if (source && campaign) return `${source} / ${campaign}`;
  return source || campaign || "";
}

export function csvEscape(v: string) {
  if (/[;"\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
