"use server";

import { requireTeacher } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { CourseLinks } from "@/lib/courseLinks";

const VALID_STATUS = new Set(["active", "paused", "completed", "cancelled"]);

export async function updateCourseStatusAction(formData: FormData) {
  const { teacherId } = await requireTeacher();
  const courseId = formData.get("course_id") as string;
  const status = formData.get("status") as string;
  const studentId = formData.get("student_id") as string;

  if (!VALID_STATUS.has(status)) throw new Error("잘못된 상태값");

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("courses")
    .update({ status })
    .eq("id", courseId)
    .eq("teacher_id", teacherId!);

  if (error) throw error;

  revalidatePath(`/teacher/students/${studentId}`);
  revalidatePath(`/teacher`);
  revalidatePath(`/admin/courses`);
}

export async function updateCourseLinksAction(formData: FormData) {
  const { teacherId } = await requireTeacher();
  const courseId = formData.get("course_id") as string;
  const studentId = formData.get("student_id") as string;

  const keys: (keyof CourseLinks)[] = [
    "consultation_form",
    "course_design",
    "application_form",
    "oneday_instagram",
    "oneday_photo",
    "graduation_survey",
    "model_practice",
    "advanced_training",
  ];

  const links: CourseLinks = {};
  for (const key of keys) {
    const val = (formData.get(key) as string)?.trim();
    if (val) links[key] = val;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("courses")
    .update({ links })
    .eq("id", courseId)
    .eq("teacher_id", teacherId!);

  if (error) throw error;

  revalidatePath(`/teacher/students/${studentId}`);
}

export async function ensureCourseAction(formData: FormData) {
  const { teacherId } = await requireTeacher();
  const studentId = formData.get("student_id") as string;
  const title = (formData.get("title") as string).trim();
  const totalSessions = Number(formData.get("total_sessions") ?? 10);

  const supabase = createSupabaseAdminClient();
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
