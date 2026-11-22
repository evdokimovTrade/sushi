import type { Metadata } from "next";
import { MenuScreen } from "@/components/MenuScreen";

export const metadata: Metadata = {
  title: "Шашлык и люля",
  description: "Шашлык из свинины и курицы, люля-кебаб, шаверма, картофель и грибы с мангала с доставкой по юго-западу Петербурга.",
  alternates: { canonical: "/grill" },
  openGraph: { title: "Шашлык и люля — ТаланД", description: "Шашлык из свинины и курицы, люля-кебаб, шаверма, картофель и грибы с мангала с доставкой по юго-западу Петербурга.", images: [{ url: "/og/grill.jpg", width: 1200, height: 630 }] },
};

export default function Page() {
  return <MenuScreen categoryId="grill" />;
}
