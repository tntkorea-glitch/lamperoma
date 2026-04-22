import { requireStudent } from "@/lib/auth/getUser";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import Link from "next/link";
import type { ReactNode } from "react";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  await requireStudent();

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/student" className="text-lg font-bold tracking-tight">
            Lamperoma <span className="text-xs font-normal text-gray-400">수강</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/student/settings" className="text-gray-700 hover:text-gray-900">
              설정
            </Link>
            <NotificationBell />
            <form action="/auth/signout" method="post">
              <button className="text-gray-400 hover:text-gray-900">로그아웃</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
