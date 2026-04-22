import { auth } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function TeacherInviteLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();

  const { data: invite } = await admin
    .from("teacher_invites")
    .select("id, name, salon_name, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return (
      <Center>
        <h1 className="text-xl font-bold">유효하지 않은 초대링크</h1>
        <p className="mt-2 text-sm text-gray-500">관리자에게 확인 부탁드려요.</p>
      </Center>
    );
  }

  if (invite.used_at) {
    return (
      <Center>
        <h1 className="text-xl font-bold">이미 사용된 링크</h1>
        <p className="mt-2 text-sm text-gray-500">
          이미 가입 완료하셨어요. 로그인 페이지로 이동해주세요.
        </p>
        <a
          href="/login"
          className="mt-6 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
        >
          로그인하기
        </a>
      </Center>
    );
  }

  if (new Date(invite.expires_at) < new Date()) {
    return (
      <Center>
        <h1 className="text-xl font-bold">만료된 초대링크</h1>
        <p className="mt-2 text-sm text-gray-500">관리자에게 새 링크를 요청해주세요.</p>
      </Center>
    );
  }

  const session = await auth();
  if (session?.user?.id) redirect(`/teacher-invite/${token}/accept`);

  return (
    <Center>
      <div className="mb-4 text-4xl">👩‍🏫</div>
      <h1 className="text-xl font-bold">
        {invite.salon_name ?? "Lamperoma"} 원장 초대
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        {invite.name ? `${invite.name}님, ` : ""}네일 아크릴 수강일지 관리 플랫폼에 초대되었습니다.
      </p>
      <p className="mt-4 text-xs text-gray-500">
        구글 계정으로 로그인하시면 원장 대시보드를 사용하실 수 있어요.
      </p>
      <a
        href={`/login?teacher_invite=${token}&next=${encodeURIComponent(`/teacher-invite/${token}/accept`)}`}
        className="mt-6 inline-block rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white"
      >
        구글 계정으로 시작하기
      </a>
    </Center>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
        {children}
      </div>
    </main>
  );
}
