import type { Metadata } from "next";
import { MenuScreen } from "@/components/MenuScreen";

export const metadata: Metadata = { title: "Суши" };

export default function Page() {
  return <MenuScreen categoryId="sushi" />;
}
