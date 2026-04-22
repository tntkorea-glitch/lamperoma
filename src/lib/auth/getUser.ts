import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { resolveRole } from "./bootstrap";

export async function getAuthedUser() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) redirect("/login");
  const user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
  };
  const role = await resolveRole(user.id, user.email, user.name);
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
