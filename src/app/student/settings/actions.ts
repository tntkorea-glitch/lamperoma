"use server";

import { requireStudent } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateStudentProfileAction(formData: FormData) {
  const { studentId } = await requireStudent();
  const name = (formData.get("name") as string).trim();
  const phone = ((formData.get("phone") as string) ?? "").trim() || null;

  if (!name) throw new Error("이름은 필수입니다");

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("students")
    .update({ name, phone })
    .eq("id", studentId!);

  if (error) throw error;

  revalidatePath("/student");
  revalidatePath("/student/settings");
}
