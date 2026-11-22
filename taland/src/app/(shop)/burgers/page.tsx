import type { Metadata } from "next";
import { MenuScreen } from "@/components/MenuScreen";

export const metadata: Metadata = {
  title: "Бургеры",
  description: "Бургер, чизбургер и бургер с беконом — говядина, курица или двойная говядина. Доставка по юго-западу Петербурга.",
  alternates: { canonical: "/burgers" },
  openGraph: { title: "Бургеры — ТаланД", description: "Бургер, чизбургер и бургер с беконом — говядина, курица или двойная говядина. Доставка по юго-западу Петербурга.", images: [{ url: "/og/burgers.jpg", width: 1200, height: 630 }] },
};

export default function Page() {
  return <MenuScreen categoryId="burgers" />;
}
