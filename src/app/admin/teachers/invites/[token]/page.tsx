import { requireAdmin } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CopyButton } from "./CopyButton";

export default async function TeacherInviteDetailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await requireAdmin();
  const { token } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: invite } = await supabase
    .from("teacher_invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!invite) notFound();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3011";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}/teacher-invite/${token}`;

  const messageTemplate = `안녕하세요 ${invite.name ?? ""}원장님,
Lamperoma 수강일지 관리 플랫폼에 초대합니다.

아래 링크를 클릭해서 구글 계정으로 가입해주세요:
${url}

(유효기간: ${new Date(invite.expires_at).toLocaleDateString("ko-KR")}까지)`;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">원장 초대링크 생성 완료</h1>
        <p className="mt-1 text-sm text-gray-500">
          {invite.name} 원장님께 아래 링크를 전달해 주세요
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <label className="mb-2 block text-xs font-medium text-gray-700">초대 링크</label>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 select-all rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs"
          />
          <CopyButton text={url} label="링크 복사" />
        </div>

        <label className="mt-6 mb-2 block text-xs font-medium text-gray-700">
          메시지 템플릿
        </label>
        <textarea
          readOnly
          value={messageTemplate}
          rows={7}
          className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs leading-relaxed"
        />
        <div className="mt-2">
          <CopyButton text={messageTemplate} label="메시지 복사" />
        </div>
      </div>

      <div className="text-center">
        <a
          href="/admin/teachers/invites"
          className="text-sm text-gray-500 underline"
        >
          원장 초대 목록으로
        </a>
      </div>
    </div>
  );
}
