import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key || key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { data: leads, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leads });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { key, id, status, notes } = body;

    if (!key || key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};
    if (status !== undefined) updatePayload.status = status;
    if (notes !== undefined) updatePayload.notes = notes;

    // 1. تحديث حالة الـ Lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (leadError) {
      return NextResponse.json({ error: leadError.message }, { status: 500 });
    }

    // 2. التحقق من تحويل الحالة إلى تجربة معلقة
    const normalizedStatus = (status || "").toLowerCase().trim();
    console.log("--> Lead status update received:", { original: status, normalized: normalizedStatus });

    const isTrialTrigger = [
      "trial_booked",
      "trial_scheduled",
      "trial booked",
      "trial scheduled",
      "trial pending",
      "trial_pending"
    ].includes(normalizedStatus);

    if (isTrialTrigger) {
      console.log("--> Trigger matched! Starting enrollment automation for lead:", lead.id);

      const parentName = lead.parent_name || lead.full_name || "ولي أمر";
      const studentName = lead.student_name || lead.full_name || "طالب جديد";
      const email = (lead.email || `lead_${lead.id.slice(0, 8)}@fazakkir.internal`).toLowerCase().trim();
      const phone = lead.phone || lead.phone_number || "";

      // أ. التحقق من وجود حساب ولي الأمر في profiles أو إنشائه عبر auth.admin
      let parentId: string | null = null;
      const { data: existingProfile, error: searchProfileErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (searchProfileErr) {
        console.error("--> Error searching profile:", searchProfileErr);
      }

      if (existingProfile) {
        parentId = existingProfile.id;
        console.log("--> Existing profile found with ID:", parentId);
      } else {
        // إنشاء المستخدم أولاً في auth.users لتفادي خطأ profiles_id_fkey
        let authUserId: string | null = null;

        const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
          email: email,
          email_confirm: true,
          user_metadata: { full_name: parentName, role: "parent_student" },
        });

        if (authErr) {
          console.warn("--> Could not create auth user, checking if user already exists in auth:", authErr.message);
          // إذا كان الإيميل مسجلاً بالفعل مسبقاً في auth.users
          const { data: userList } = await supabase.auth.admin.listUsers();
          const matchedUser = userList?.users?.find((u) => u.email?.toLowerCase() === email);
          if (matchedUser) {
            authUserId = matchedUser.id;
          } else {
            console.error("--> Failed to obtain auth user ID:", authErr);
          }
        } else if (authUser?.user) {
          authUserId = authUser.user.id;
          console.log("--> Created auth user with ID:", authUserId);
        }

        // إنشاء السجل المقابل في جدول profiles
        if (authUserId) {
          const { data: newProfile, error: profileErr } = await supabase
            .from("profiles")
            .upsert([
              {
                id: authUserId,
                full_name: parentName,
                email: email,
                phone: phone,
                role: "parent_student",
              },
            ])
            .select("id")
            .single();

          if (profileErr) {
            console.error("--> Error upserting profile:", profileErr);
          } else if (newProfile) {
            parentId = newProfile.id;
            console.log("--> Linked profile created with ID:", parentId);
          }
        }
      }

      // ب. إنشاء أو إيجاد سجل الطالب
      let studentId: string | null = null;
      if (parentId) {
        const { data: existingStudent, error: searchStudentErr } = await supabase
          .from("students")
          .select("id")
          .eq("parent_id", parentId)
          .eq("student_name", studentName)
          .maybeSingle();

        if (searchStudentErr) {
          console.error("--> Error searching student:", searchStudentErr);
        }

        if (existingStudent) {
          studentId = existingStudent.id;
          console.log("--> Existing student found with ID:", studentId);
        } else {
          const { data: newStudent, error: studentErr } = await supabase
            .from("students")
            .insert([
              {
                parent_id: parentId,
                student_name: studentName,
                level: lead.preferred_course || lead.course_name || "Beginner",
              },
            ])
            .select("id")
            .single();

          if (studentErr) {
            console.error("--> Error inserting student:", studentErr);
          } else if (newStudent) {
            studentId = newStudent.id;
            console.log("--> Created new student with ID:", studentId);
          }
        }
      } else {
        console.warn("--> parentId is null, cannot proceed with student creation!");
      }

      // جـ. إدراج سجل التسكين في جدول enrollments بحالة trial_pending
      if (studentId) {
        const { data: existingEnrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("student_id", studentId)
          .eq("status", "trial_pending")
          .maybeSingle();

        if (!existingEnrollment) {
          const { data: newEnrollment, error: enrollErr } = await supabase
            .from("enrollments")
            .insert([
              {
                student_id: studentId,
                status: "trial_pending",
                plan_tier: lead.plan_name || "Trial",
                weekly_classes_count: lead.student_count || lead.students_count || 1,
                class_duration_minutes: 30,
                tutor_id: null,
              },
            ])
            .select()
            .single();

          if (enrollErr) {
            console.error("--> Error inserting enrollment:", enrollErr);
          } else {
            console.log("--> SUCCESS! Created enrollment:", newEnrollment.id);
          }
        } else {
          console.log("--> Enrollment already exists for student:", existingEnrollment.id);
        }
      } else {
        console.warn("--> studentId is null, cannot insert enrollment!");
      }
    } else {
      console.log("--> Trigger condition NOT met. Normalized status is:", normalizedStatus);
    }

    return NextResponse.json({ success: true, lead });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, full_name, email, phone_number, country_code, course_name, status, plan_name, students_count } = body;

    if (!key || key !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          full_name,
          parent_name: full_name,
          email,
          phone_number,
          country_code: country_code || "+1",
          phone: `${country_code || ""} ${phone_number}`.trim(),
          course_name,
          preferred_course: course_name,
          status: status || "Booked",
          plan_name: plan_name || "Standard",
          students_count: Number(students_count || 1),
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}