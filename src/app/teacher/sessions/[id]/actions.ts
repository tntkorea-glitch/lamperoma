"use server";

import { requireTeacher } from "@/lib/auth/getUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

async function upsertLog(
  formData: FormData,
  opts: { publish: boolean },
) {
  await requireTeacher();
  const sessionId = formData.get("session_id") as string;
  const title = (formData.get("title") as string).trim() || null;
  const content = (formData.get("content") as string) ?? "";
  const strengths = (formData.get("strengths") as string).trim() || null;
  const improvements = (formData.get("improvements") as string).trim() || null;
  const nextPrep = (formData.get("next_prep") as string).trim() || null;
  const images = JSON.parse((formData.get("images") as string) ?? "[]") as string[];

  const supabase = await createSupabaseServerClient();
  const payload = {
    session_id: sessionId,
    title,
    content,
    strengths,
    improvements,
    next_prep: nextPrep,
    images,
    ...(opts.publish ? { published_at: new Date().toISOString() } : {}),
  };

  const { error } = await supabase
    .from("lesson_logs")
    .upsert(payload, { onConflict: "session_id" });
  if (error) throw error;

  // 세션 상태 업데이트
  await supabase
    .from("course_sessions")
    .update({ status: opts.publish ? "logged" : "in_progress" })
    .eq("id", sessionId);

  revalidatePath(`/teacher/sessions/${sessionId}`);
  revalidatePath(`/student/sessions/${sessionId}`);
}

export async function saveLessonLogAction(formData: FormData) {
  await upsertLog(formData, { publish: false });
}

export async function publishLessonLogAction(formData: FormData) {
  await upsertLog(formData, { publish: true });

  const studentId = formData.get("student_id") as string;
  const studentEmail = (formData.get("student_email") as string) || undefined;
  const studentPhone = (formData.get("student_phone") as string) || undefined;
  const sessionId = formData.get("session_id") as string;

  await sendNotification({
    userId: studentId,
    email: studentEmail,
    phone: studentPhone,
    type: "LESSON_LOG_PUBLISHED",
    title: "수강일지가 등록되었습니다",
    body: "원장님이 오늘 수업 내용을 정리해 주셨어요. 확인하고 궁금한 점은 댓글로 남겨주세요.",
    link: `/student/sessions/${sessionId}`,
  });
}
