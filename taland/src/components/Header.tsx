"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/sushi", label: "Суши", track: "nav_sushi" },
  { href: "/grill", label: "Шашлык", track: "nav_grill" },
  { href: "/burgers", label: "Бургеры", track: "nav_burgers" },
];

export function Header() {
  const path = usePathname();
  return (
    <header className="top">
      <Link className="top__logo" href="/" data-track="nav_logo">
        <img src="/brand/taland-logo-header.webp" width={240} height={135} alt="ТаланД" />
      </Link>
      <nav className="top__nav" aria-label="Меню">
        {LINKS.map((link) => (
          <Link key={link.href} className="nav-link" href={link.href} data-track={link.track} aria-current={path === link.href ? "page" : undefined}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
