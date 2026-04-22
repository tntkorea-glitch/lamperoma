export default function UnassignedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5 text-center">
        <div className="mb-4 text-4xl">🎨</div>
        <h1 className="mb-2 text-xl font-bold text-gray-900">아직 배정되지 않았습니다</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          수강 신청 전에 로그인하신 것 같아요.
          <br />
          원장님에게 받으신 <b>초대 링크</b>로 다시 접속해 주세요.
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button
            type="submit"
            className="text-xs text-gray-400 underline underline-offset-2"
          >
            다른 계정으로 로그인하기
          </button>
        </form>
      </div>
    </main>
  );
}
