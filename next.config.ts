import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co", // مجهز لصور المقالات ورفع الوسائط لاحقاً
      },
    ],
  },
};

export default nextConfig;