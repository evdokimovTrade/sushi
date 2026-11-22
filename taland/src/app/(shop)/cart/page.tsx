import type { Metadata } from "next";
import { CartPanel } from "@/components/CartPanel";

export const metadata: Metadata = { robots: { index: false }, title: "Корзина" };

export default function Page() {
  return (
    <main className="wrap">
      <CartPanel mode="cart" />
    </main>
  );
}
