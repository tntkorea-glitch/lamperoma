import { requireTeacher } from "@/lib/auth/getUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LessonLogEditor } from "./LessonLogEditor";
import { CommentThread } from "@/components/session/CommentThread";

export default async function TeacherSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireTeacher();
  const { id: sessionId } = await params;

  const supabase = await createSupabaseServerClient();

  const { data: session } = await supabase
    .from("course_sessions")
    .select(
      "id, session_no, scheduled_at, course:courses(id, title, total_sessions, student:students(id, name, email, phone))",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) notFound();

  const course = Array.isArray(session.course) ? session.course[0] : session.course;
  const student = course && (Array.isArray(course.student) ? course.student[0] : course.student);

  const { data: log } = await supabase
    .from("lesson_logs")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/teacher/students/${student?.id ?? ""}`}
          className="text-xs text-gray-500 hover:underline"
        >
          ← {student?.name}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">
          {session.session_no}회차 수업
          {course?.total_sessions && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              / 총 {course.total_sessions}회
            </span>
          )}
        </h1>
      </div>

      <LessonLogEditor
        sessionId={sessionId}
        studentId={student?.id ?? ""}
        studentEmail={student?.email ?? ""}
        studentPhone={student?.phone ?? null}
        initial={log ?? null}
      />

      <div>
        <h2 className="mb-3 text-lg font-semibold">질문 & 피드백</h2>
        <CommentThread
          sessionId={sessionId}
          role="teacher"
          initialComments={comments ?? []}
        />
      </div>
    </div>
  );
}
