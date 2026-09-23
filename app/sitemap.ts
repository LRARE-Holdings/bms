import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();

  const pages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/events`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/health-statement`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // Published events, including past ones — their pages stay up for links already shared.
  const studioId = process.env.NEXT_PUBLIC_STUDIO_ID;
  if (!studioId) return pages;
  const { data: events } = await createAdminClient()
    .from("events")
    .select("slug, updated_at")
    .eq("studio_id", studioId)
    .eq("is_published", true)
    .is("cancelled_at", null);

  for (const e of events ?? []) {
    pages.push({
      url: `${baseUrl}/events/${e.slug}`,
      lastModified: new Date(e.updated_at),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
  return pages;
}
