import { requireTeacher } from "@/lib/auth/getUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CopyButton } from "./CopyButton";

export default async function InviteDetailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { teacherId } = await requireTeacher();
  const { token } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: invite } = await supabase
    .from("invites")
    .select("*")
    .eq("token", token)
    .eq("teacher_id", teacherId!)
    .maybeSingle();

  if (!invite) notFound();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3011";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}/invite/${token}`;

  const messageTemplate = `안녕하세요 ${invite.name ?? ""}님,
람페로마 네일 아크릴 수강일지에 초대합니다.

아래 링크를 클릭해서 구글 계정으로 가입해주세요:
${url}

(유효기간: ${new Date(invite.expires_at).toLocaleDateString("ko-KR")}까지)`;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">초대링크 생성 완료</h1>
        <p className="mt-1 text-sm text-gray-500">
          {invite.name}님께 아래 링크를 전달해 주세요
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
          메시지 템플릿 (문자/카톡에 복사해서 보내세요)
        </label>
        <textarea
          readOnly
          value={messageTemplate}
          rows={7}
          className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs leading-relaxed"
        />
        <div className="mt-2 flex gap-2">
          <CopyButton text={messageTemplate} label="메시지 복사" />
          <KakaoShareButton text={messageTemplate} url={url} />
        </div>
      </div>

      <div className="text-center">
        <a href="/teacher/invites" className="text-sm text-gray-500 underline">
          초대링크 목록으로
        </a>
      </div>
    </div>
  );
}

function KakaoShareButton({ text, url }: { text: string; url: string }) {
  const smsHref = `sms:?body=${encodeURIComponent(text)}`;
  return (
    <a
      href={smsHref}
      className="rounded-lg bg-[#FEE500] px-4 py-2 text-xs font-semibold text-[#191919] hover:brightness-95"
    >
      문자로 보내기
    </a>
  );
}
