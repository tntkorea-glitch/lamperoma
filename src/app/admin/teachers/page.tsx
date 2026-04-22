import { requireAdmin } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function AllTeachersPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, name, email, salon_name, phone, created_at, students:students(count), courses:courses(count)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">원장 관리</h1>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        {!teachers || teachers.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            아직 가입한 원장이 없어요
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-5 py-3 text-left font-medium">이름</th>
                <th className="px-5 py-3 text-left font-medium">이메일</th>
                <th className="px-5 py-3 text-right font-medium">수강생</th>
                <th className="px-5 py-3 text-right font-medium">과정</th>
                <th className="px-5 py-3 text-right font-medium">가입일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teachers.map((t) => {
                const students = Array.isArray(t.students) ? t.students[0]?.count ?? 0 : 0;
                const courses = Array.isArray(t.courses) ? t.courses[0]?.count ?? 0 : 0;
                return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/teachers/${t.id}`}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        {t.name}
                      </Link>
                      {t.salon_name && (
                        <p className="text-xs text-gray-500">{t.salon_name}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{t.email}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700">
                      {students}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700">
                      {courses}
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-gray-500">
                      {new Date(t.created_at).toLocaleDateString("ko-KR")}
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
