import type { Metadata } from "next";
import { MenuScreen } from "@/components/MenuScreen";

export const metadata: Metadata = { title: "Бургеры" };

export default function Page() {
  return <MenuScreen categoryId="burgers" />;
}
