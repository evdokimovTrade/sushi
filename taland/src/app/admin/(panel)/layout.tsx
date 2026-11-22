"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Заказы" },
  { href: "/admin/kitchen", label: "Кухня" },
  { href: "/admin/menu", label: "Меню" },
  { href: "/admin/promos", label: "Промокоды" },
  { href: "/admin/zones", label: "Зоны" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }
  return (
    <div>
      <header className="admin-top">
        <div className="admin-top__row">
          <img src="/brand/taland-logo-header.webp" width={240} height={135} alt="ТаланД" />
          <strong>Админка</strong>
          <button className="btn btn--ghost" type="button" style={{ marginLeft: "auto", flex: "0 0 auto" }} onClick={logout}>Выйти</button>
        </div>
        <nav className="admin-nav">
          {LINKS.map((link) => (
            <Link key={link.href} className="nav-link" href={link.href} aria-current={path === link.href ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
          <Link className="nav-link" href="/">Сайт</Link>
        </nav>
      </header>
      <main className="wrap">{children}</main>
    </div>
  );
}
