import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/gremio", "/portales", "/mision", "/perfil", "/tienda", "/auth"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
