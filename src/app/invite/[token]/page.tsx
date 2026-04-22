import { auth } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function InviteLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();
  const { data: invite } = await admin
    .from("invites")
    .select("id, name, expires_at, used_at, teacher_id, teachers:teachers(name, salon_name)")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return (
      <Center>
        <h1 className="text-xl font-bold">유효하지 않은 초대링크</h1>
        <p className="mt-2 text-sm text-gray-500">원장님께 다시 요청해주세요.</p>
      </Center>
    );
  }

  if (invite.used_at) {
    return (
      <Center>
        <h1 className="text-xl font-bold">이미 사용된 링크입니다</h1>
        <p className="mt-2 text-sm text-gray-500">
          이미 가입을 완료하셨어요. 로그인 페이지로 이동해주세요.
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
        <p className="mt-2 text-sm text-gray-500">원장님께 새 링크를 요청해주세요.</p>
      </Center>
    );
  }

  // 이미 로그인 되어 있으면 accept로 바로
  const supabase = createSupabaseAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(`/invite/${token}/accept`);

  const teacher = Array.isArray(invite.teachers) ? invite.teachers[0] : invite.teachers;

  return (
    <Center>
      <div className="mb-4 text-4xl">💅</div>
      <h1 className="text-xl font-bold">
        {teacher?.salon_name ?? teacher?.name ?? "람페로마"} 초대
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        {invite.name ? `${invite.name}님, ` : ""}수강일지 관리에 초대되었습니다.
      </p>
      <p className="mt-4 text-xs text-gray-500">
        구글 계정으로 로그인하시면 수강일지를 확인하실 수 있어요.
      </p>
      <a
        href={`/login?invite=${token}&next=${encodeURIComponent(`/invite/${token}/accept`)}`}
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
