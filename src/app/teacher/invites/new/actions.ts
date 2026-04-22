"use server";

import { requireTeacher } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createInviteAction(formData: FormData) {
  const { teacherId } = await requireTeacher();
  const name = (formData.get("name") as string | null)?.trim() || null;
  const email = (formData.get("email") as string | null)?.trim() || null;
  const phone = (formData.get("phone") as string | null)?.trim() || null;

  if (!name) throw new Error("이름을 입력해주세요");

  const token = randomBytes(16).toString("base64url");
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("invites")
    .insert({ teacher_id: teacherId!, token, name, email, phone })
    .select("token")
    .single();

  if (error) throw error;

  revalidatePath("/teacher/invites");
  redirect(`/teacher/invites/${data.token}`);
}
