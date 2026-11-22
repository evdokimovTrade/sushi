import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { Analytics } from "@/components/Analytics";
import { ConsentBanner } from "@/components/ConsentBanner";
import "./globals.css";

const BASE = process.env.PUBLIC_BASE_URL || "http://localhost:3000";
const DESCRIPTION = "Доставка суши, шашлыка и бургеров по юго-западу Петербурга: Аннино, Новоселье, Горелово, Красное Село. Заказ и оплата на сайте.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: { default: "ТаланД — доставка суши, шашлыка и бургеров", template: "%s — ТаланД" },
  description: DESCRIPTION,
  icons: { icon: "/brand/taland-logo-dark.png" },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "ТаланД",
    title: "ТаланД — просто вкусно",
    description: DESCRIPTION,
    images: [{ url: "/og/sushi.jpg", width: 1200, height: 630, alt: "Роллы Филадельфия — ТаланД" }],
  },
  robots: { index: true, follow: true },
};

/** Разметка для поисковиков: только то, что есть на сайте. Адрес и телефон появятся, когда их даст заказчик. */
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "ТаланД",
  slogan: "Просто вкусно",
  url: BASE,
  image: `${BASE}/brand/taland-logo-dark.png`,
  servesCuisine: ["Японская", "Кавказская", "Американская"],
  hasMenu: `${BASE}/sushi`,
  areaServed: ["Аннино", "Новоселье", "Горелово", "Красное Село"].map((name) => ({ "@type": "Place", name })),
  acceptsReservations: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Unbounded:wght@700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
        <Providers>
          <Analytics />
          <ConsentBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
