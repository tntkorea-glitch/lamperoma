"use client";

import { SearchableList } from "@/components/common/SearchableTable";
import Link from "next/link";

type Teacher = {
  id: string;
  name: string;
  email: string;
  salon_name: string | null;
  phone: string | null;
  created_at: string;
  students?: Array<{ count: number }>;
  courses?: Array<{ count: number }>;
};

export function TeachersTable({ teachers }: { teachers: Teacher[] }) {
  return (
    <SearchableList
      items={teachers}
      placeholder="원장 이름·이메일·네일샵으로 검색"
      filter={(t, q) =>
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.salon_name ?? "").toLowerCase().includes(q)
      }
      render={(filtered) => (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
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
              {filtered.map((t) => {
                const students = t.students?.[0]?.count ?? 0;
                const courses = t.courses?.[0]?.count ?? 0;
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
        </div>
      )}
    />
  );
}
