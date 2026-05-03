import { requireStudent } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DdayCounter } from "@/components/DdayCounter";
import Link from "next/link";

export default async function StudentDashboard() {
  const { studentId } = await requireStudent();
  const supabase = createSupabaseAdminClient();

  const { data: courses } = await supabase
    .from("courses")
    .select(
      "id, title, total_sessions, status, started_at, created_at, teacher:teachers(name, salon_name, email, phone), course_sessions(id, session_no, status, lesson_logs(id, title, published_at, updated_at))",
    )
    .eq("student_id", studentId!)
    .order("created_at", { ascending: false });

  const activeCourse = courses?.find((c) => c.status === "active") ?? courses?.[0];
  const teacher = activeCourse && (Array.isArray(activeCourse.teacher) ? activeCourse.teacher[0] : activeCourse.teacher);

  if (!activeCourse) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
        <div className="mb-3 text-4xl">🎨</div>
        <p className="text-sm text-gray-600">
          원장님이 수강 과정을 개설하시면 여기에 나타날 거예요.
        </p>
      </div>
    );
  }

  const sessionsByNo = new Map(
    (activeCourse.course_sessions ?? []).map((s) => [s.session_no, s]),
  );

  const ddayStart = activeCourse.started_at ?? activeCourse.created_at;

  return (
    <div className="space-y-6">
      <DdayCounter startDate={ddayStart} />

      <div>
        <p className="text-xs text-gray-500">
          {teacher?.salon_name ?? teacher?.name ?? "원장"}
        </p>
        <h1 className="text-2xl font-bold text-gray-900">{activeCourse.title}</h1>
        <p className="mt-1 text-sm text-gray-500">총 {activeCourse.total_sessions}회차</p>
      </div>

      <ul className="space-y-2">
        {[...Array(activeCourse.total_sessions)].map((_, i) => {
          const no = i + 1;
          const s = sessionsByNo.get(no);
          const log = s?.lesson_logs as
            | Array<{ id: string; title: string | null; published_at: string | null; updated_at: string }>
            | undefined;
          const published = log?.[0]?.published_at;
          const title = log?.[0]?.title ?? `${no}회차 수업`;

          const disabled = !s || !published;

          return (
            <li key={no}>
              <Link
                href={disabled ? "#" : `/student/sessions/${s!.id}`}
                aria-disabled={disabled}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
                  disabled
                    ? "pointer-events-none border-gray-100 bg-gray-50 text-gray-400"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                      disabled ? "bg-gray-200 text-gray-400" : "bg-gray-900 text-white"
                    }`}
                  >
                    {no}
                  </span>
                  <span className="font-medium">{title}</span>
                </div>
                {disabled ? (
                  <span className="text-xs">아직 등록 전</span>
                ) : (
                  <span className="text-xs text-gray-500">
                    {new Date(published!).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
