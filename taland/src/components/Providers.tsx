"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { oncePerSession, track } from "@/lib/analytics";
import type { CartLine, CategoryDTO, CustomerDraft, ItemDTO, ZoneDTO } from "@/lib/types";

const CART_KEY = "taland_cart_v1";
const ZONE_KEY = "taland_zone_v1";
const CUSTOMER_KEY = "taland_customer_v1";
const UTM_SOURCE = "taland_utm_source";
const UTM_CAMPAIGN = "taland_utm_campaign";

type QuoteRow = { index: number; item: ItemDTO; variantName: string; qty: number; price: number; sum: number };

type CartValue = {
  ready: boolean;
  menuReady: boolean;
  categories: CategoryDTO[];
  items: ItemDTO[];
  zones: ZoneDTO[];
  lines: CartLine[];
  zoneId: string;
  setZoneId: (id: string) => void;
  customer: CustomerDraft;
  setCustomer: (patch: Partial<CustomerDraft>) => void;
  utmSource: string;
  utmCampaign: string;
  add: (itemId: string, variantId: string, qty: number) => void;
  setQty: (index: number, qty: number) => void;
  setVariant: (index: number, variantId: string) => void;
  remove: (index: number) => void;
  clear: () => void;
  replaceLines: (lines: CartLine[]) => void;
  quote: {
    rows: QuoteRow[];
    subtotal: number;
    discount: number;
    promoError: string;
    deliveryFee: number;
    total: number;
    minOrder: number;
    zoneName: string;
    belowMin: boolean;
    count: number;
  };
  toast: (message: string) => void;
  refreshMenu: () => void;
};

const CartContext = createContext<CartValue | null>(null);

const emptyCustomer: CustomerDraft = { name: "", phone: "", address: "", comment: "", promo: "" };

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [menuReady, setMenuReady] = useState(false);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [zones, setZones] = useState<ZoneDTO[]>([]);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [zoneId, setZoneIdState] = useState("annino");
  const [customer, setCustomerState] = useState<CustomerDraft>(emptyCustomer);
  const [utmSource, setUtmSource] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [toastText, setToastText] = useState("");

  const items = useMemo(() => categories.flatMap((category) => category.items), [categories]);

  const loadMenu = useCallback(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
        setZones(data.zones || []);
        setMenuReady(true);
      })
      .catch(() => setMenuReady(true));
  }, []);

  useEffect(() => {
    loadMenu();
    const params = new URLSearchParams(window.location.search);
    const source = params.get("utm_source");
    const campaign = params.get("utm_campaign");
    if (source) localStorage.setItem(UTM_SOURCE, source.slice(0, 80));
    if (campaign) localStorage.setItem(UTM_CAMPAIGN, campaign.slice(0, 80));
    const storedCustomer = readJson<CustomerDraft>(CUSTOMER_KEY, emptyCustomer);
    const promo = params.get("promo");
    if (promo && !storedCustomer.promo) storedCustomer.promo = promo.slice(0, 40);
    setCustomerState({ ...emptyCustomer, ...storedCustomer });
    setLines(readJson<CartLine[]>(CART_KEY, []).filter((line) => line.qty > 0));
    setZoneIdState(localStorage.getItem(ZONE_KEY) || "annino");
    setUtmSource(localStorage.getItem(UTM_SOURCE) || "");
    setUtmCampaign(localStorage.getItem(UTM_CAMPAIGN) || "");
    setReady(true);
  }, [loadMenu]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }, [lines, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(ZONE_KEY, zoneId);
  }, [zoneId, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  }, [customer, ready]);

  useEffect(() => {
    if (!menuReady || !ready) return;
    setLines((prev) => {
      const next = prev.filter((line) => {
        const item = items.find((entry) => entry.id === line.itemId);
        return Boolean(item?.variants.some((variant) => variant.id === line.variantId));
      });
      return next.length === prev.length ? prev : next;
    });
  }, [menuReady, ready, items]);

  const subtotal = useMemo(() => {
    return lines.reduce((sum, line) => {
      const item = items.find((entry) => entry.id === line.itemId);
      const variant = item?.variants.find((entry) => entry.id === line.variantId);
      return sum + (variant ? variant.price * line.qty : 0);
    }, 0);
  }, [lines, items]);

  useEffect(() => {
    const code = customer.promo.trim();
    if (!code) {
      setDiscount(0);
      setPromoError("");
      return;
    }
    const timer = setTimeout(() => {
      fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            setDiscount(0);
            setPromoError(data.error || "Промокод не найден");
            oncePerSession(`promo_bad_${code.toUpperCase()}`, () => track("promo_invalid", { code: code.slice(0, 40), reason: String(data.error || "").slice(0, 60) }));
          } else {
            setDiscount(data.discount || 0);
            setPromoError("");
            oncePerSession(`promo_ok_${code.toUpperCase()}`, () => track("promo_applied", { code: code.slice(0, 40) }, data.discount || 0));
          }
        })
        .catch(() => setPromoError("Не удалось проверить промокод"));
    }, 250);
    return () => clearTimeout(timer);
  }, [customer.promo, subtotal]);

  const toast = useCallback((message: string) => {
    setToastText(message);
    window.setTimeout(() => setToastText(""), 1800);
  }, []);

  const add = useCallback((itemId: string, variantId: string, qty: number) => {
    setLines((prev) => {
      const index = prev.findIndex((line) => line.itemId === itemId && line.variantId === variantId);
      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], qty: Math.min(99, next[index].qty + qty) };
        return next;
      }
      return [...prev, { itemId, variantId, qty: Math.min(99, qty) }];
    });
  }, []);

  const setQty = useCallback((index: number, qty: number) => {
    setLines((prev) => {
      if (!prev[index]) return prev;
      if (qty <= 0) return prev.filter((_, i) => i !== index);
      const next = [...prev];
      next[index] = { ...next[index], qty: Math.min(99, qty) };
      return next;
    });
  }, []);

  const setVariant = useCallback((index: number, variantId: string) => {
    setLines((prev) => {
      const line = prev[index];
      if (!line) return prev;
      const other = prev.findIndex((entry, i) => i !== index && entry.itemId === line.itemId && entry.variantId === variantId);
      if (other >= 0) {
        const next = prev.filter((_, i) => i !== index);
        const target = next.findIndex((entry) => entry.itemId === line.itemId && entry.variantId === variantId);
        if (target >= 0) next[target] = { ...next[target], qty: Math.min(99, next[target].qty + line.qty) };
        return next;
      }
      const next = [...prev];
      next[index] = { ...line, variantId };
      return next;
    });
  }, []);

  const remove = useCallback((index: number) => setQty(index, 0), [setQty]);
  const clear = useCallback(() => setLines([]), []);
  const replaceLines = useCallback((next: CartLine[]) => setLines(next), []);
  const setZoneId = useCallback((id: string) => setZoneIdState(id), []);
  const setCustomer = useCallback((patch: Partial<CustomerDraft>) => {
    setCustomerState((prev) => ({ ...prev, ...patch }));
  }, []);

  const zone = zones.find((entry) => entry.id === zoneId) || zones[0];
  const quote = useMemo(() => {
    const rows: QuoteRow[] = [];
    lines.forEach((line, index) => {
      const item = items.find((entry) => entry.id === line.itemId);
      const variant = item?.variants.find((entry) => entry.id === line.variantId);
      if (!item || !variant) return;
      rows.push({
        index,
        item,
        variantName: item.qtyOnly ? "" : variant.name,
        qty: line.qty,
        price: variant.price,
        sum: variant.price * line.qty,
      });
    });
    const food = rows.reduce((sum, row) => sum + row.sum, 0);
    const fee = zone?.fee || 0;
    const minOrder = zone?.minOrder || 0;
    return {
      rows,
      subtotal: food,
      discount,
      promoError,
      deliveryFee: fee,
      total: Math.max(0, food - discount) + fee,
      minOrder,
      zoneName: zone?.name || "",
      belowMin: food > 0 && food < minOrder,
      count: rows.reduce((sum, row) => sum + row.qty, 0),
    };
  }, [lines, items, zone, discount, promoError]);

  const value: CartValue = {
    ready,
    menuReady,
    categories,
    items,
    zones,
    lines,
    zoneId: zone?.id || zoneId,
    setZoneId,
    customer,
    setCustomer,
    utmSource,
    utmCampaign,
    add,
    setQty,
    setVariant,
    remove,
    clear,
    replaceLines,
    quote,
    toast,
    refreshMenu: loadMenu,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      <div className={`toast${toastText ? " show" : ""}`} role="status">{toastText}</div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("Корзина недоступна");
  return value;
}
