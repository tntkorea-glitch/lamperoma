"use server";

import { requireAdmin } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function getUserInfo(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data.user;
}

export async function promoteToTeacherAction(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("user_id") as string;
  const supabase = createSupabaseAdminClient();

  const user = await getUserInfo(userId);
  if (!user) throw new Error("사용자를 찾을 수 없습니다");

  // 기존 student row 있으면 삭제 (cascade로 과정·일지도 정리)
  await supabase.from("students").delete().eq("id", userId);

  // teacher 로 등록 (이미 있으면 이름/이메일만 갱신)
  const { error } = await supabase
    .from("teachers")
    .upsert(
      {
        id: userId,
        email: user.email!,
        name:
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.email!,
      },
      { onConflict: "id" },
    );
  if (error) throw error;

  revalidatePath("/admin/users");
  revalidatePath("/admin/teachers");
  revalidatePath("/admin");
}

export async function demoteTeacherAction(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("user_id") as string;
  const supabase = createSupabaseAdminClient();

  // 수강생 존재 여부 체크 (있으면 삭제 거부)
  const { count: studentCount } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", userId);

  if ((studentCount ?? 0) > 0) {
    throw new Error(
      `수강생 ${studentCount}명이 소속되어 있어 해제할 수 없습니다. 먼저 수강생을 다른 원장으로 이동하거나 삭제해주세요.`,
    );
  }

  const { error } = await supabase.from("teachers").delete().eq("id", userId);
  if (error) throw error;

  revalidatePath("/admin/users");
  revalidatePath("/admin/teachers");
  revalidatePath("/admin");
}

export async function assignStudentAction(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("user_id") as string;
  const teacherId = formData.get("teacher_id") as string;
  if (!teacherId) throw new Error("원장을 선택해주세요");

  const supabase = createSupabaseAdminClient();

  const user = await getUserInfo(userId);
  if (!user) throw new Error("사용자를 찾을 수 없습니다");

  // teacher row 가 있으면 거부 (역할 충돌)
  const { data: isTeacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (isTeacher) {
    throw new Error("원장 계정은 수강생으로 지정할 수 없습니다. 먼저 원장에서 해제하세요.");
  }

  const { error } = await supabase
    .from("students")
    .upsert(
      {
        id: userId,
        teacher_id: teacherId,
        email: user.email!,
        name:
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.email!,
      },
      { onConflict: "id" },
    );
  if (error) throw error;

  revalidatePath("/admin/users");
  revalidatePath("/admin/students");
  revalidatePath("/admin");
}

export async function unassignStudentAction(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("user_id") as string;
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("students").delete().eq("id", userId);
  if (error) throw error;

  revalidatePath("/admin/users");
  revalidatePath("/admin/students");
  revalidatePath("/admin");
}
