import type { Metadata } from "next";
import { MenuScreen } from "@/components/MenuScreen";

export const metadata: Metadata = {
  title: "Суши",
  description: "Филадельфия, Калифорния, запечённые роллы, нигири и маки с доставкой по Аннино, Новоселью, Горелово и Красному Селу.",
  alternates: { canonical: "/sushi" },
  openGraph: { title: "Суши — ТаланД", description: "Филадельфия, Калифорния, запечённые роллы, нигири и маки с доставкой по Аннино, Новоселью, Горелово и Красному Селу.", images: [{ url: "/og/sushi.jpg", width: 1200, height: 630 }] },
};

export default function Page() {
  return <MenuScreen categoryId="sushi" />;
}
