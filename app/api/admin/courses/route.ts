import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// 1. جلب كل الكورسات للإدارة
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key || key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: courses, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ courses });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. إضافة كورس جديد
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      key,
      slug,
      title,
      subtitle,
      badge,
      category,
      icon,
      summary,
      prerequisites,
      duration,
      levels,
      learning_outcomes,
      books_materials,
    } = body;

    if (!key || key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!slug || !title) {
      return NextResponse.json({ error: "Title and Slug are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("courses")
      .insert([
        {
          slug: slug.toLowerCase().trim().replace(/\s+/g, "-"),
          title,
          subtitle: subtitle || "",
          badge: badge || "",
          category: category || "General",
          icon: icon || "fa-book-open",
          summary: summary || "",
          prerequisites: prerequisites || "None",
          duration: duration || "Custom",
          levels: levels || [],
          learning_outcomes: learning_outcomes || [],
          books_materials: books_materials || [],
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, course: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. تعديل كورس موجود
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { key, id, ...updateData } = body;

    if (!key || key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("courses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, course: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 4. حذف كورس
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const id = searchParams.get("id");

    if (!key || key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    const { error } = await supabase.from("courses").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}