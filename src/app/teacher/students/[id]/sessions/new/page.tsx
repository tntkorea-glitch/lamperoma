import { requireTeacher } from "@/lib/auth/getUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CreateSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ no?: string; course_id?: string }>;
}) {
  const { teacherId } = await requireTeacher();
  const { id: studentId } = await params;
  const { no, course_id: courseId } = await searchParams;
  if (!no || !courseId) redirect(`/teacher/students/${studentId}`);

  const supabase = await createSupabaseServerClient();

  // course 가 teacher 소유 + student 연결인지 검증 (RLS가 막긴 하지만 방어적으로)
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId!)
    .eq("teacher_id", teacherId!)
    .eq("student_id", studentId)
    .maybeSingle();
  if (!course) redirect(`/teacher/students/${studentId}`);

  // session 존재 보장 (upsert)
  const { data: session } = await supabase
    .from("course_sessions")
    .upsert(
      {
        course_id: courseId!,
        session_no: Number(no),
      },
      { onConflict: "course_id,session_no", ignoreDuplicates: false },
    )
    .select("id")
    .single();

  if (session) redirect(`/teacher/sessions/${session.id}`);
  redirect(`/teacher/students/${studentId}`);
}
