"use server";

import { requireAdmin } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createTeacherInviteAction(formData: FormData) {
  const { adminId } = await requireAdmin();
  const name = (formData.get("name") as string | null)?.trim() || null;
  const salonName = (formData.get("salon_name") as string | null)?.trim() || null;
  const email = (formData.get("email") as string | null)?.trim() || null;
  const phone = (formData.get("phone") as string | null)?.trim() || null;

  if (!name) throw new Error("이름을 입력해주세요");

  const token = randomBytes(16).toString("base64url");
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("teacher_invites")
    .insert({
      created_by: adminId!,
      token,
      name,
      salon_name: salonName,
      email,
      phone,
    })
    .select("token")
    .single();

  if (error) throw error;

  revalidatePath("/admin/teachers/invites");
  redirect(`/admin/teachers/invites/${data.token}`);
}
