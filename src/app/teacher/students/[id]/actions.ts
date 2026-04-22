"use server";

import { requireTeacher } from "@/lib/auth/getUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function ensureCourseAction(formData: FormData) {
  const { teacherId } = await requireTeacher();
  const studentId = formData.get("student_id") as string;
  const title = (formData.get("title") as string).trim();
  const totalSessions = Number(formData.get("total_sessions") ?? 10);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("courses")
    .insert({
      teacher_id: teacherId!,
      student_id: studentId,
      title,
      total_sessions: totalSessions,
      started_at: new Date().toISOString().slice(0, 10),
      status: "active",
    })
    .select("id")
    .single();

  if (error) throw error;

  revalidatePath(`/teacher/students/${studentId}`);
  void data;
  redirect(`/teacher/students/${studentId}`);
}
