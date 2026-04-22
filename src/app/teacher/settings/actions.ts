"use server";

import { requireTeacher } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateTeacherProfileAction(formData: FormData) {
  const { teacherId } = await requireTeacher();
  const name = (formData.get("name") as string).trim();
  const salonName = ((formData.get("salon_name") as string) ?? "").trim() || null;
  const phone = ((formData.get("phone") as string) ?? "").trim() || null;

  if (!name) throw new Error("이름은 필수입니다");

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("teachers")
    .update({ name, salon_name: salonName, phone })
    .eq("id", teacherId!);

  if (error) throw error;

  revalidatePath("/teacher");
  revalidatePath("/teacher/settings");
}
