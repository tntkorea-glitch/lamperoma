"use client";

import { SearchableList } from "@/components/common/SearchableTable";

type Student = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  teacher: { id: string; name: string; salon_name: string | null } | { id: string; name: string; salon_name: string | null }[] | null;
  courses: Array<{ id: string; title: string; status: string }> | null;
};

export function StudentsTable({ students }: { students: Student[] }) {
  return (
    <SearchableList
      items={students}
      placeholder="수강생 이름·이메일·원장이름으로 검색"
      filter={(s, q) => {
        const teacher = Array.isArray(s.teacher) ? s.teacher[0] : s.teacher;
        return (
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (teacher?.name ?? "").toLowerCase().includes(q) ||
          (teacher?.salon_name ?? "").toLowerCase().includes(q)
        );
      }}
      render={(filtered) => (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
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
              {filtered.map((s) => {
                const teacher = Array.isArray(s.teacher) ? s.teacher[0] : s.teacher;
                const courses = s.courses ?? [];
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
        </div>
      )}
    />
  );
}
