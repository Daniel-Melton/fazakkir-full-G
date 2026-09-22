import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// جلب كل المقالات
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key || key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: articles, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ articles });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// إضافة مقال جديد
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, slug, title, excerpt, content, category, author, author_role, reading_time, cover_image, published } = body;

    if (!key || key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!slug || !title || !content) {
      return NextResponse.json({ error: "Title, slug and content are required" }, { status: 400 });
    }

    const { data, error } = await supabase.from("articles").insert([
      {
        slug: slug.toLowerCase().trim().replace(/\s+/g, "-"),
        title,
        excerpt: excerpt || "",
        content,
        category: category || "Quran",
        author: author || "Fazakkir Academic Team",
        author_role: author_role || "Azhari Instructor",
        reading_time: reading_time || "5 min read",
        cover_image: cover_image || "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1200&q=80",
        published: published !== undefined ? published : true,
      },
    ]).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, article: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// تعديل مقال
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { key, id, ...updateData } = body;

    if (!key || key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) return NextResponse.json({ error: "Article ID is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("articles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, article: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// حذف مقال
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const id = searchParams.get("id");

    if (!key || key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) return NextResponse.json({ error: "Article ID is required" }, { status: 400 });

    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}