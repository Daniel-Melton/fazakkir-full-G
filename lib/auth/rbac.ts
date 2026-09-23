import { createClient } from "@supabase/supabase-js";
import { UserRole, Profile } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function verifyUserRole(
  authHeader: string | null,
  allowedRoles: UserRole[]
): Promise<{ error: string | null; profile: Profile | null; status: number }> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Missing or invalid authorization token", profile: null, status: 401 };
  }

  const token = authHeader.replace("Bearer ", "");
  
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return { error: "Invalid or expired session", profile: null, status: 401 };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Profile not found", profile: null, status: 404 };
  }

  if (!allowedRoles.includes(profile.role as UserRole)) {
    return { error: "Forbidden: insufficient permissions", profile: null, status: 403 };
  }

  return { error: null, profile: profile as Profile, status: 200 };
}