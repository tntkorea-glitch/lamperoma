import { requireAdmin } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AllCoursesPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const { data: courses } = await supabase
    .from("courses")
    .select(
      "id, title, total_sessions, status, started_at, created_at, teacher:teachers(name, salon_name), student:students(id, name), course_sessions(id, status)",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">전체 수강 과정</h1>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        {!courses || courses.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            아직 개설된 과정이 없어요
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-5 py-3 text-left font-medium">과정명</th>
                <th className="px-5 py-3 text-left font-medium">원장</th>
                <th className="px-5 py-3 text-left font-medium">수강생</th>
                <th className="px-5 py-3 text-center font-medium">진행률</th>
                <th className="px-5 py-3 text-right font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map((c) => {
                const teacher = Array.isArray(c.teacher) ? c.teacher[0] : c.teacher;
                const student = Array.isArray(c.student) ? c.student[0] : c.student;
                const sessions = (c.course_sessions ?? []) as Array<{ status: string }>;
                const completed = sessions.filter(
                  (s) => s.status === "logged" || s.status === "completed",
                ).length;

                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{c.title}</td>
                    <td className="px-5 py-3 text-gray-700">{teacher?.name ?? "-"}</td>
                    <td className="px-5 py-3 text-gray-700">{student?.name ?? "-"}</td>
                    <td className="px-5 py-3 text-center">
                      <div className="mx-auto flex w-32 items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full bg-gray-900"
                            style={{
                              width: `${Math.round((completed / c.total_sessions) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {completed}/{c.total_sessions}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "진행중", cls: "bg-emerald-100 text-emerald-700" },
    paused: { label: "일시중지", cls: "bg-yellow-100 text-yellow-700" },
    completed: { label: "완료", cls: "bg-gray-100 text-gray-700" },
    cancelled: { label: "취소", cls: "bg-red-100 text-red-700" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${s.cls}`}>{s.label}</span>
  );
}
