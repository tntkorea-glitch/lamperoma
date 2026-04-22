import { requireTeacher } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { StudentListSearch } from "./StudentListSearch";

export default async function TeacherDashboard() {
  const { teacherId } = await requireTeacher();
  const supabase = createSupabaseAdminClient();

  const { data: students } = await supabase
    .from("students")
    .select(
      "id, name, email, phone, created_at, courses:courses(id, title, total_sessions, status, course_sessions(id, status))",
    )
    .eq("teacher_id", teacherId!)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">수강생 관리</h1>
        <Link
          href="/teacher/invites/new"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          + 초대링크 발급
        </Link>
      </div>

      {!students || students.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-black/5">
          <div className="mb-4 text-4xl">💅</div>
          <h2 className="mb-2 text-lg font-semibold">아직 등록된 수강생이 없어요</h2>
          <p className="mb-6 text-sm text-gray-500">
            초대링크를 발급해서 수강생에게 전달해 주세요
          </p>
          <Link
            href="/teacher/invites/new"
            className="inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
          >
            첫 초대링크 만들기
          </Link>
        </div>
      ) : (
        <StudentListSearch students={students} />
      )}
    </div>
  );
}
