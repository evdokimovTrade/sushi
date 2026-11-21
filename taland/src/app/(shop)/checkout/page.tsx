import type { Metadata } from "next";
import { CartPanel } from "@/components/CartPanel";

export const metadata: Metadata = { title: "Оформление заказа" };

export default function Page() {
  return (
    <main className="wrap">
      <CartPanel mode="checkout" />
    </main>
  );
}
