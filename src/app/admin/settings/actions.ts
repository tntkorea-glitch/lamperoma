"use server";

import { requireAdmin } from "@/lib/auth/getUser";
import { setSetting } from "@/lib/settings";
import { revalidatePath } from "next/cache";

export async function toggleSmsAction(formData: FormData) {
  await requireAdmin();
  const enabled = formData.get("enabled") === "true";
  await setSetting("sms_enabled", { enabled });
  revalidatePath("/admin/settings");
}
