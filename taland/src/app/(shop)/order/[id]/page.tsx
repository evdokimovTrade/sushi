"use client";

import { useParams } from "next/navigation";
import { OrderStatus } from "@/components/OrderStatus";

export default function Page() {
  const params = useParams<{ id: string }>();
  return (
    <main className="wrap">
      <OrderStatus id={params.id} />
    </main>
  );
}
