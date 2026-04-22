import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type Role = "admin" | "teacher" | "student" | "unassigned";

/**
 * 유저의 role 해석 + 필요 시 admin row 자동 생성.
 * 우선순위: admin > teacher > student > unassigned
 */
export async function resolveRole(
  userId: string,
  email?: string | null,
  name?: string | null,
): Promise<{
  role: Role;
  adminId?: string;
  teacherId?: string;
  studentId?: string;
}> {
  const supabase = createSupabaseAdminClient();
  const lowerEmail = email?.toLowerCase() ?? null;

  // 1) ADMIN_EMAILS 매칭 → admins row 자동 생성
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (lowerEmail && adminEmails.includes(lowerEmail)) {
    const { data: existing } = await supabase
      .from("admins")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (!existing) {
      await supabase.from("admins").insert({
        id: userId,
        email: email!,
        name: name ?? "관리자",
      });
    }
    return { role: "admin", adminId: userId };
  }

  // 2) 이미 admin?
  const { data: admin } = await supabase
    .from("admins")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (admin) return { role: "admin", adminId: admin.id };

  // 3) teacher?
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (teacher) return { role: "teacher", teacherId: teacher.id };

  // 4) student?
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (student) return { role: "student", studentId: student.id };

  return { role: "unassigned" };
}
