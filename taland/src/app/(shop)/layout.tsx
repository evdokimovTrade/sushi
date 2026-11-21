import { CartBar } from "@/components/CartBar";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shop">
      <Header />
      {children}
      <Footer />
      <CartBar />
    </div>
  );
}
