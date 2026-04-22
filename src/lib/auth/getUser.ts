import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveRole } from "./bootstrap";
import { redirect } from "next/navigation";

export async function getAuthedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const role = await resolveRole(user);
  return { user, ...role };
}

export async function requireAdmin() {
  const authed = await getAuthedUser();
  if (authed.role !== "admin") redirect("/");
  return authed;
}

export async function requireTeacher() {
  const authed = await getAuthedUser();
  if (authed.role !== "teacher") redirect("/");
  return authed;
}

export async function requireStudent() {
  const authed = await getAuthedUser();
  if (authed.role !== "student") redirect("/");
  return authed;
}
