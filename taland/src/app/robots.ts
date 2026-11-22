import type { MetadataRoute } from "next";

const BASE = process.env.PUBLIC_BASE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/cart", "/checkout", "/pay", "/order", "/account"] }, sitemap: `${BASE}/sitemap.xml` };
}
