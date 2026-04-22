import { auth } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function AcceptTeacherInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email) redirect(`/teacher-invite/${token}`);

  const admin = createSupabaseAdminClient();

  const { data: invite } = await admin
    .from("teacher_invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return <Msg title="유효하지 않은 초대링크" body="관리자에게 확인 부탁드려요." />;
  if (invite.used_at) redirect("/teacher");
  if (new Date(invite.expires_at) < new Date())
    return <Msg title="만료된 초대링크" body="새 링크를 요청해주세요." />;

  // admin/student 계정은 거부
  const { data: isAdmin } = await admin
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (isAdmin) {
    return (
      <Msg
        title="관리자 계정으로는 수락할 수 없습니다"
        body="다른 구글 계정으로 다시 로그인해주세요."
      />
    );
  }

  const { data: isStudent } = await admin
    .from("students")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (isStudent) {
    return (
      <Msg
        title="수강생 계정으로는 수락할 수 없습니다"
        body="다른 구글 계정으로 다시 로그인해주세요."
      />
    );
  }

  // teacher row upsert
  const { error } = await admin.from("teachers").upsert(
    {
      id: user.id,
      email: user.email,
      name: invite.name ?? user.name ?? user.email,
      salon_name: invite.salon_name,
      phone: invite.phone,
    },
    { onConflict: "id" },
  );
  if (error) return <Msg title="원장 등록 실패" body={error.message} />;

  await admin
    .from("teacher_invites")
    .update({ used_at: new Date().toISOString(), used_by: user.id })
    .eq("id", invite.id);

  redirect("/teacher");
}

function Msg({ title, body }: { title: string; body: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">{body}</p>
      </div>
    </main>
  );
}
