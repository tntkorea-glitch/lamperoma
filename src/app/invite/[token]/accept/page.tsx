import { auth } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();
  const user = session?.user;

  if (!user?.id || !user.email) redirect(`/invite/${token}`);

  const admin = createSupabaseAdminClient();

  const { data: invite } = await admin
    .from("invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return <Msg title="유효하지 않은 초대링크" body="원장님께 확인 부탁드려요." />;
  if (invite.used_at) {
    redirect("/student");
  }
  if (new Date(invite.expires_at) < new Date()) {
    return <Msg title="만료된 초대링크" body="새 링크를 요청해주세요." />;
  }

  // 관리자/원장 계정으로는 수강생 초대를 수락할 수 없음
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

  const { data: isTeacher } = await admin
    .from("teachers")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (isTeacher) {
    return (
      <Msg
        title="원장 계정으로는 수락할 수 없습니다"
        body="다른 구글 계정으로 다시 로그인해주세요."
      />
    );
  }

  // student 생성 or 연결
  const { data: existingStudent } = await admin
    .from("students")
    .select("id, teacher_id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingStudent) {
    const updates: Record<string, string> = { teacher_id: invite.teacher_id };
    if (invite.name) updates.name = invite.name;
    await admin.from("students").update(updates).eq("id", user.id);
  } else {
    const { error } = await admin.from("students").insert({
      id: user.id,
      teacher_id: invite.teacher_id,
      name: invite.name ?? user.name ?? user.email,
      email: user.email,
      phone: invite.phone,
    });
    if (error) {
      return <Msg title="수강생 등록에 실패했습니다" body={error.message} />;
    }
  }

  await admin
    .from("invites")
    .update({ used_at: new Date().toISOString(), used_by: user.id })
    .eq("id", invite.id);

  redirect("/student");
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
