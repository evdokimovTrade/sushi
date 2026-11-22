import type { MetadataRoute } from "next";

const BASE = process.env.PUBLIC_BASE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/sushi`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/grill`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/burgers`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/legal/delivery`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/legal/offer`, lastModified: now, changeFrequency: "monthly", priority: 0.2 },
    { url: `${BASE}/legal/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.2 },
  ];
}
