import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabaseClient";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://fazakkir.com";

  // 1. الصفحات الثابتة
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // 2. جلب روابط الكورسات من قاعدة البيانات
  const { data: courses } = await supabase
    .from("courses")
    .select("slug, created_at");

  const coursePages: MetadataRoute.Sitemap = (courses || []).map((course) => ({
    url: `${baseUrl}/courses/${course.slug}`,
    lastModified: new Date(course.created_at || Date.now()),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  // 3. جلب روابط المقالات المنشورة
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, created_at")
    .eq("published", true);

  const articlePages: MetadataRoute.Sitemap = (articles || []).map((art) => ({
    url: `${baseUrl}/blog/${art.slug}`,
    lastModified: new Date(art.created_at || Date.now()),
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [...staticPages, ...coursePages, ...articlePages];
}