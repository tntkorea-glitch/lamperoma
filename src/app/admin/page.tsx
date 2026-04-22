import { requireAdmin } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function AdminDashboard() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const [
    { count: teacherCount },
    { count: studentCount },
    { count: activeCourseCount },
    { count: publishedLogCount },
    { data: recentTeachers },
  ] = await Promise.all([
    supabase.from("teachers").select("*", { count: "exact", head: true }),
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase
      .from("courses")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("lesson_logs")
      .select("*", { count: "exact", head: true })
      .not("published_at", "is", null),
    supabase
      .from("teachers")
      .select("id, name, email, salon_name, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">시스템 대시보드</h1>
          <p className="mt-1 text-sm text-gray-500">
            전체 원장 / 수강생 / 수업 현황을 한눈에 확인
          </p>
        </div>
        <Link
          href="/admin/teachers/invites/new"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          + 원장 초대하기
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="원장"
          value={teacherCount ?? 0}
          accent="text-violet-600"
          href="/admin/teachers"
        />
        <Stat
          label="수강생"
          value={studentCount ?? 0}
          accent="text-blue-600"
          href="/admin/students"
        />
        <Stat
          label="진행 중 과정"
          value={activeCourseCount ?? 0}
          accent="text-emerald-600"
          href="/admin/courses"
        />
        <Stat
          label="작성된 일지"
          value={publishedLogCount ?? 0}
          accent="text-amber-600"
        />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">최근 가입 원장</h2>
          <Link
            href="/admin/teachers"
            className="text-xs text-gray-500 hover:underline"
          >
            전체 보기 →
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          {!recentTeachers || recentTeachers.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              아직 가입한 원장이 없어요
              <br />
              <Link
                href="/admin/teachers/invites/new"
                className="mt-3 inline-block rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white"
              >
                첫 원장 초대하기
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentTeachers.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/admin/teachers/${t.id}`}
                    className="flex items-center justify-between px-5 py-3 transition hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">
                        {t.name}
                        {t.salon_name && (
                          <span className="ml-2 text-xs font-normal text-gray-500">
                            · {t.salon_name}
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-gray-500">{t.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(t.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </Link>
                </li>
              ))}
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
  accent,
  href,
}: {
  label: string;
  value: number;
  accent: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent}`}>{value.toLocaleString()}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:ring-gray-300"
      >
        {inner}
      </Link>
    );
  }
  return <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">{inner}</div>;
}
