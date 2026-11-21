import type { Metadata } from "next";
import { MenuScreen } from "@/components/MenuScreen";

export const metadata: Metadata = { title: "Шашлык и люля" };

export default function Page() {
  return <MenuScreen categoryId="grill" />;
}
