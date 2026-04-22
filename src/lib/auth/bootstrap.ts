import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

/**
 * 로그인한 유저의 role 확인 + 필요 시 teacher row 자동 생성.
 * ADMIN_EMAILS env에 포함된 이메일이면 첫 로그인 시 teachers row 생성.
 *
 * Returns role info.
 */
export async function resolveRole(user: User): Promise<{
  role: "teacher" | "student" | "unassigned";
  teacherId?: string;
  studentId?: string;
}> {
  const supabase = createSupabaseAdminClient();
  const email = user.email?.toLowerCase();

  // 1) 이미 teacher?
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (teacher) return { role: "teacher", teacherId: teacher.id };

  // 2) ADMIN_EMAILS 해당하면 teacher로 승격
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (email && adminEmails.includes(email)) {
    const { error } = await supabase.from("teachers").insert({
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? "원장",
    });
    if (!error) return { role: "teacher", teacherId: user.id };
  }

  // 3) 이미 student?
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (student) return { role: "student", studentId: student.id };

  return { role: "unassigned" };
}
