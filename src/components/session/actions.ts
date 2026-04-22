"use server";

import { getAuthedUser } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendNotification } from "@/lib/notifications";

export async function addCommentAction(formData: FormData) {
  const { user, role } = await getAuthedUser();
  if (role !== "teacher" && role !== "student") {
    throw new Error("권한 없음");
  }

  const sessionId = formData.get("session_id") as string;
  const formRole = formData.get("role") as string;
  const body = ((formData.get("body") as string) ?? "").trim();
  const images = JSON.parse((formData.get("images") as string) ?? "[]") as string[];

  if (!body && images.length === 0) return;
  if (formRole !== role) throw new Error("role mismatch");

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("comments").insert({
    session_id: sessionId,
    author_id: user.id,
    author_role: role,
    body,
    images,
  });
  if (error) throw error;

  // 상대방에게 알림
  const admin = createSupabaseAdminClient();
  const { data: session } = await admin
    .from("course_sessions")
    .select("session_no, course:courses(teacher_id, student_id, students(email, phone), teachers(email, phone))")
    .eq("id", sessionId)
    .maybeSingle();

  if (session) {
    const course = Array.isArray(session.course) ? session.course[0] : session.course;
    if (course) {
      const recipientId = role === "teacher" ? course.student_id : course.teacher_id;
      const info =
        role === "teacher"
          ? (Array.isArray(course.students) ? course.students[0] : course.students)
          : (Array.isArray(course.teachers) ? course.teachers[0] : course.teachers);

      const link = role === "teacher"
        ? `/student/sessions/${sessionId}`
        : `/teacher/sessions/${sessionId}`;

      await sendNotification({
        userId: recipientId,
        email: info?.email,
        phone: info?.phone ?? undefined,
        type: role === "teacher" ? "TEACHER_COMMENT" : "STUDENT_COMMENT",
        title:
          role === "teacher"
            ? `${session.session_no}회차 수업에 원장님 답변이 달렸어요`
            : `${session.session_no}회차 수업에 수강생 질문이 도착했어요`,
        body: body.slice(0, 80),
        link,
      });
    }
  }
}
