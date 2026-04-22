"use client";

import { SearchableList } from "@/components/common/SearchableTable";
import Link from "next/link";

type Student = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  courses?: Array<{
    id: string;
    title: string;
    total_sessions: number;
    status: string;
    course_sessions?: Array<{ id: string; status: string }>;
  }>;
};

export function StudentListSearch({ students }: { students: Student[] }) {
  return (
    <SearchableList
      items={students}
      placeholder="이름·이메일·전화로 검색"
      filter={(s, q) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.phone ?? "").toLowerCase().includes(q)
      }
      render={(filtered) => (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((s) => {
            const courses = s.courses ?? [];
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
    />
  );
}
