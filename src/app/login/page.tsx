"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const invite = searchParams.get("invite");
  const error = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", next);
    if (invite) redirectTo.searchParams.set("invite", invite);

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo.toString() },
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          Lamperoma
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          네일 아크릴 수강일지 관리
        </p>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
            로그인에 실패했습니다. 다시 시도해 주세요.
          </p>
        )}

        <div className="space-y-2">
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <GoogleIcon />
            {loading ? "이동 중..." : "Google로 계속하기"}
          </button>

          <button
            onClick={() => alert("카카오 로그인은 준비 중입니다")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] py-3 text-sm font-medium text-[#191919] transition hover:brightness-95"
          >
            <KakaoIcon />
            카카오로 계속하기
          </button>

          <button
            onClick={() => alert("네이버 로그인은 준비 중입니다")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#03C75A] py-3 text-sm font-medium text-white transition hover:brightness-95"
          >
            <NaverIcon />
            네이버로 계속하기
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          초대받으신 수강생은 초대링크로 접속해 주세요
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C40.7 36 44 30.5 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#191919" d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.8 6.8L5.5 22l4.5-2.5c.6.1 1.3.1 2 .1 5.5 0 10-3.6 10-8.1S17.5 3 12 3z" />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#fff" d="M13.6 12.1L9.9 6.5H6v11h4.4v-5.6l3.7 5.6H18v-11h-4.4v5.6z" />
    </svg>
  );
}
