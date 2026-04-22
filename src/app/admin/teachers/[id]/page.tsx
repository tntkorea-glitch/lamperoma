import { requireAdmin } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminTeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!teacher) notFound();

  const [
    { data: students },
    { count: invitesCount },
    { count: publishedLogs },
  ] = await Promise.all([
    supabase
      .from("students")
      .select("id, name, email, created_at, courses:courses(id, title, total_sessions, status)")
      .eq("teacher_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invites")
      .select("*", { count: "exact", head: true })
      .eq("teacher_id", id),
    supabase
      .from("lesson_logs")
      .select("course_sessions!inner(course_id, courses!inner(teacher_id))", {
        count: "exact",
        head: true,
      })
      .eq("course_sessions.courses.teacher_id", id)
      .not("published_at", "is", null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/teachers" className="text-xs text-gray-500 hover:underline">
          ← 원장 목록
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{teacher.name}</h1>
        <p className="text-sm text-gray-500">
          {teacher.email} {teacher.phone ? `· ${teacher.phone}` : ""}
          {teacher.salon_name && ` · ${teacher.salon_name}`}
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="수강생" value={students?.length ?? 0} />
        <Stat label="발급 초대" value={invitesCount ?? 0} />
        <Stat label="작성 일지" value={publishedLogs ?? 0} />
        <Stat
          label="가입일"
          value={new Date(teacher.created_at).toLocaleDateString("ko-KR")}
          isText
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">수강생 목록</h2>
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          {!students || students.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              등록된 수강생이 없습니다
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {students.map((s) => {
                const courses = (s.courses ?? []) as Array<{
                  id: string;
                  title: string;
                  total_sessions: number;
                  status: string;
                }>;
                const active = courses.find((c) => c.status === "active");
                return (
                  <li key={s.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.email}</p>
                      </div>
                      <div className="text-right">
                        {active ? (
                          <p className="text-xs text-gray-600">
                            {active.title} · {active.total_sessions}회차
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">수강과정 없음</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {new Date(s.created_at).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  isText,
}: {
  label: string;
  value: number | string;
  isText?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p
        className={`mt-1 ${isText ? "text-base" : "text-2xl"} font-bold text-gray-900`}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
