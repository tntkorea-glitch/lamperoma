import { getAuthedUser } from "@/lib/auth/getUser";
import { redirect } from "next/navigation";

export default async function Home() {
  const { role } = await getAuthedUser();
  if (role === "teacher") redirect("/teacher");
  if (role === "student") redirect("/student");
  redirect("/unassigned");
}
