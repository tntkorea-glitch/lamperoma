import { requireAdmin } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { UserRow } from "./UserRow";

export default async function AdminUsersPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const [
    { data: authList },
    { data: admins },
    { data: teachers },
    { data: students },
  ] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 200 }),
    supabase.from("admins").select("id"),
    supabase.from("teachers").select("id, name, salon_name"),
    supabase.from("students").select("id, teacher_id"),
  ]);

  const adminSet = new Set((admins ?? []).map((a) => a.id));
  const teacherMap = new Map(
    (teachers ?? []).map((t) => [t.id, { name: t.name, salon_name: t.salon_name }]),
  );
  const studentMap = new Map(
    (students ?? []).map((s) => [s.id, { teacher_id: s.teacher_id }]),
  );

  const teacherOptions = (teachers ?? []).map((t) => ({
    id: t.id,
    label: t.salon_name ? `${t.name} (${t.salon_name})` : t.name,
  }));

  const users = authList?.users ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          구글로 로그인한 모든 사용자와 역할을 관리합니다
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        {users.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            아직 가입한 사용자가 없어요
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-5 py-3 text-left font-medium">사용자</th>
                <th className="px-5 py-3 text-left font-medium">현재 역할</th>
                <th className="px-5 py-3 text-left font-medium">관리</th>
                <th className="px-5 py-3 text-right font-medium">가입일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users
                .sort((a, b) =>
                  (a.created_at ?? "").localeCompare(b.created_at ?? ""),
                )
                .map((u) => {
                  let role: "admin" | "teacher" | "student" | "unassigned" = "unassigned";
                  if (adminSet.has(u.id)) role = "admin";
                  else if (teacherMap.has(u.id)) role = "teacher";
                  else if (studentMap.has(u.id)) role = "student";

                  const studentInfo = studentMap.get(u.id);
                  const studentTeacher = studentInfo
                    ? teacherMap.get(studentInfo.teacher_id)
                    : undefined;

                  return (
                    <UserRow
                      key={u.id}
                      user={{
                        id: u.id,
                        email: u.email ?? "",
                        name:
                          (u.user_metadata?.full_name as string | undefined) ??
                          (u.user_metadata?.name as string | undefined) ??
                          u.email ??
                          "-",
                        created_at: u.created_at ?? new Date().toISOString(),
                      }}
                      role={role}
                      studentTeacher={studentTeacher}
                      teacherOptions={teacherOptions}
                    />
                  );
                })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
