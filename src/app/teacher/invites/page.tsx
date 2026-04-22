import { requireTeacher } from "@/lib/auth/getUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function InvitesPage() {
  const { teacherId } = await requireTeacher();
  const supabase = await createSupabaseServerClient();

  const { data: invites } = await supabase
    .from("invites")
    .select("*")
    .eq("teacher_id", teacherId!)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">초대링크</h1>
        <Link
          href="/teacher/invites/new"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          + 새 초대링크
        </Link>
      </div>

      {!invites || invites.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5 text-sm text-gray-500">
          아직 발급된 초대링크가 없어요
        </div>
      ) : (
        <ul className="space-y-2">
          {invites.map((inv) => (
            <InviteRow key={inv.id} invite={inv} />
          ))}
        </ul>
      )}
    </div>
  );
}

function InviteRow({
  invite,
}: {
  invite: {
    id: string;
    token: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    expires_at: string;
    used_at: string | null;
  };
}) {
  const isUsed = !!invite.used_at;
  const isExpired = new Date(invite.expires_at) < new Date();

  return (
    <li className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {invite.name ?? "(이름 미지정)"}
            </span>
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
            {invite.email ?? "-"} · {invite.phone ?? "-"}
          </p>
        </div>
        {!isUsed && !isExpired && <CopyLinkButton token={invite.token} />}
      </div>
    </li>
  );
}

function CopyLinkButton({ token }: { token: string }) {
  return (
    <form action={`/api/invites/${token}/copy`}>
      <code className="block select-all rounded bg-gray-50 px-2 py-1 text-xs text-gray-600">
        /invite/{token.slice(0, 8)}...
      </code>
    </form>
  );
}
