import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * مطابقة كافة مسارات التطبيق باستثناء:
     * - _next/static (الملفات الثابتة)
     * - _next/image (تحسين الصور)
     * - favicon.ico (أيقونة الموقع)
     * - أي ملف يحتوي على امتداد (مثل .svg, .png, .jpg)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};