import { requireTeacher } from "@/lib/auth/getUser";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import Link from "next/link";
import type { ReactNode } from "react";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  await requireTeacher();

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/teacher" className="text-lg font-bold tracking-tight">
            Lamperoma <span className="text-xs font-normal text-gray-400">원장</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/teacher" className="text-gray-700 hover:text-gray-900">
              대시보드
            </Link>
            <Link href="/teacher/invites" className="text-gray-700 hover:text-gray-900">
              초대
            </Link>
            <Link href="/teacher/settings" className="text-gray-700 hover:text-gray-900">
              설정
            </Link>
            <NotificationBell />
            <form action="/auth/signout" method="post">
              <button className="text-gray-400 hover:text-gray-900">로그아웃</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
