import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

export type Role = "admin" | "teacher" | "student" | "unassigned";

/**
 * 로그인한 유저의 role 해석 + 필요 시 admin row 자동 생성.
 *
 * 우선순위: admin > teacher > student > unassigned
 *
 * - ADMIN_EMAILS env 에 포함된 이메일이면 admins row 자동 생성 (시스템 관리자)
 * - 초대 수락으로 students row 가 있으면 학생
 * - 그 외에는 unassigned
 */
export async function resolveRole(user: User): Promise<{
  role: Role;
  adminId?: string;
  teacherId?: string;
  studentId?: string;
}> {
  const supabase = createSupabaseAdminClient();
  const email = user.email?.toLowerCase();

  // 1) ADMIN_EMAILS 매칭 → admins row 보장
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (email && adminEmails.includes(email)) {
    const { data: existing } = await supabase
      .from("admins")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (!existing) {
      await supabase.from("admins").insert({
        id: user.id,
        email: user.email!,
        name:
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          "관리자",
      });
    }
    return { role: "admin", adminId: user.id };
  }

  // 2) 이미 admin?
  const { data: admin } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (admin) return { role: "admin", adminId: admin.id };

  // 3) teacher?
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (teacher) return { role: "teacher", teacherId: teacher.id };

  // 4) student?
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (student) return { role: "student", studentId: student.id };

  return { role: "unassigned" };
}
