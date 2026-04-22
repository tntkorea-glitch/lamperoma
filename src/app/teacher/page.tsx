import { requireTeacher } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

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
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {students.map((s) => {
            const courses = (s.courses ?? []) as Array<{
              id: string;
              title: string;
              total_sessions: number;
              status: string;
              course_sessions?: Array<{ id: string; status: string }>;
            }>;
            const activeCourse = courses.find((c) => c.status === "active");
            const completed =
              activeCourse?.course_sessions?.filter(
                (cs) => cs.status === "logged" || cs.status === "completed",
              ).length ?? 0;
            const total = activeCourse?.total_sessions ?? 0;

            return (
              <li key={s.id}>
                <Link
                  href={`/teacher/students/${s.id}`}
                  className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:ring-gray-300"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">{s.name}</h3>
                    {activeCourse ? (
                      <span className="text-xs text-gray-500">
                        {completed}/{total} 회차
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">수강과정 없음</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{s.email}</p>
                  {activeCourse && (
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full bg-gray-900 transition-all"
                        style={{ width: total ? `${(completed / total) * 100}%` : "0%" }}
                      />
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
