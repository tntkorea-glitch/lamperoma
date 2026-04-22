import { requireAdmin } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AllStudentsPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const { data: students } = await supabase
    .from("students")
    .select(
      "id, name, email, phone, created_at, teacher:teachers(id, name, salon_name), courses:courses(id, title, status)",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">전체 수강생</h1>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        {!students || students.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            등록된 수강생이 없어요
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-5 py-3 text-left font-medium">수강생</th>
                <th className="px-5 py-3 text-left font-medium">원장</th>
                <th className="px-5 py-3 text-left font-medium">현재 과정</th>
                <th className="px-5 py-3 text-right font-medium">등록일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s) => {
                const teacher = Array.isArray(s.teacher) ? s.teacher[0] : s.teacher;
                const courses = (s.courses ?? []) as Array<{
                  id: string;
                  title: string;
                  status: string;
                }>;
                const active = courses.find((c) => c.status === "active");

                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {teacher?.name ?? "-"}
                      {teacher?.salon_name && (
                        <span className="ml-1 text-xs text-gray-500">
                          · {teacher.salon_name}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {active?.title ?? (
                        <span className="text-xs text-gray-400">수강과정 없음</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-gray-500">
                      {new Date(s.created_at).toLocaleDateString("ko-KR")}
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
