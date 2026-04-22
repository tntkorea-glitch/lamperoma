import { requireAdmin } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function TeacherInvitesPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const { data: invites } = await supabase
    .from("teacher_invites")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">원장 초대링크</h1>
        <Link
          href="/admin/teachers/invites/new"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          + 새 원장 초대
        </Link>
      </div>

      {!invites || invites.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5 text-sm text-gray-500">
          아직 발급된 원장 초대링크가 없어요
        </div>
      ) : (
        <ul className="space-y-2">
          {invites.map((inv) => {
            const isUsed = !!inv.used_at;
            const isExpired = new Date(inv.expires_at) < new Date();
            return (
              <li key={inv.id}>
                <Link
                  href={`/admin/teachers/invites/${inv.token}`}
                  className="block rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:ring-gray-300"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {inv.name ?? "(이름 미지정)"}
                        </span>
                        {inv.salon_name && (
                          <span className="text-xs text-gray-500">
                            · {inv.salon_name}
                          </span>
                        )}
                        {isUsed && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                            사용됨
                          </span>
                        )}
                        {!isUsed && isExpired && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                            만료
                          </span>
                        )}
                        {!isUsed && !isExpired && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                            대기중
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-gray-500">
                        {inv.email ?? "-"} · {inv.phone ?? "-"}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">›</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
