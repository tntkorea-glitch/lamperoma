"use server";

import { getAuthedUser } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function fetchNotificationsAction() {
  const { user } = await getAuthedUser();
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return data ?? [];
}

export async function markNotificationsReadAction() {
  const { user } = await getAuthedUser();
  const supabase = createSupabaseAdminClient();

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
}
