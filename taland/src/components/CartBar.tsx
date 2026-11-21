"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { rub } from "@/lib/money";
import { useCart } from "./Providers";

export function CartBar() {
  const path = usePathname();
  const { quote } = useCart();
  if (path.startsWith("/cart") || path.startsWith("/checkout") || path.startsWith("/pay") || path.startsWith("/order") || path.startsWith("/account") || path.startsWith("/legal")) {
    return null;
  }
  return (
    <div className="bar">
      <div>Итого: <b>{rub(quote.total)}</b></div>
      <Link className="btn btn--main" href={quote.count ? "/checkout" : "/cart"} data-track="cartbar_checkout" data-p-items={String(quote.count)} data-p-total={String(quote.total)}>Оформить</Link>
    </div>
  );
}
