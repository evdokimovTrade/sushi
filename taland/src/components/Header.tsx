"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/sushi", label: "Суши" },
  { href: "/grill", label: "Шашлык" },
  { href: "/burgers", label: "Бургеры" },
];

export function Header() {
  const path = usePathname();
  return (
    <header className="top">
      <Link className="top__logo" href="/">
        <img src="/brand/taland-logo-dark.png" alt="ТаланД" />
      </Link>
      <nav className="top__nav" aria-label="Меню">
        {LINKS.map((link) => (
          <Link key={link.href} className="nav-link" href={link.href} aria-current={path === link.href ? "page" : undefined}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
