import { auth } from "@/lib/auth";
import { resolveRole } from "@/lib/auth/bootstrap";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  // 로그인된 사용자는 역할에 맞는 페이지로 이동
  if (session?.user?.id && session.user.email) {
    const { role } = await resolveRole(
      session.user.id,
      session.user.email,
      session.user.name ?? null,
    );
    if (role === "admin") redirect("/admin");
    if (role === "teacher") redirect("/teacher");
    if (role === "student") redirect("/student");
    redirect("/unassigned");
  }

  // 비로그인 방문자: 랜딩
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-gray-100 bg-white/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight">Lamperoma</span>
          <Link
            href="/login"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            로그인
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="mb-3 inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            네일 아크릴 교육 전용
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl">
            수강일지를 <span className="text-violet-600">원장과 수강생</span>이
            <br />한 곳에서 주고받으세요
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-gray-600">
            회차별 수업 내용을 정리해서 등록하면 수강생에게 바로 전달됩니다.
            <br className="hidden md:inline" />
            피드백·질문은 댓글 스레드에서, 실습 사진은 이미지로 주고받아요.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              구글 계정으로 시작하기
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid gap-4 md:grid-cols-3">
            <RoleCard
              emoji="👩‍🏫"
              title="원장님"
              desc="수강생별로 회차별 일지를 작성하고, 질문·피드백을 이어갈 수 있어요"
              bullets={["회차별 수강일지 작성", "실습 사진 업로드", "수강생 질문에 답변"]}
            />
            <RoleCard
              emoji="🎨"
              title="수강생"
              desc="원장님이 등록한 수강일지를 확인하고 궁금한 점을 바로 여쭤보세요"
              bullets={["회차별 일지 열람", "질문/피드백 남기기", "내 연습 사진 첨부"]}
            />
            <RoleCard
              emoji="🛠"
              title="관리자"
              desc="여러 네일샵의 원장님을 초대하고 전체 현황을 한눈에 보세요"
              bullets={["원장 초대 링크 발급", "사용자 역할 지정", "시스템 통계 확인"]}
            />
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-20">
          <div className="rounded-2xl bg-gray-900 p-8 text-center text-white">
            <h2 className="text-xl font-bold">초대 링크를 받으셨나요?</h2>
            <p className="mt-2 text-sm text-gray-300">
              원장님/관리자께 받으신 초대 링크를 주소창에 붙여넣어 주세요.
              <br />
              구글 계정 한 번이면 바로 시작할 수 있어요.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Lamperoma
      </footer>
    </div>
  );
}

function RoleCard({
  emoji,
  title,
  desc,
  bullets,
}: {
  emoji: string;
  title: string;
  desc: string;
  bullets: string[];
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="mb-3 text-3xl">{emoji}</div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
      <ul className="mt-4 space-y-1.5 text-xs text-gray-500">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-0.5 text-violet-500">✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
