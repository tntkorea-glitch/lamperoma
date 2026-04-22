import { requireAdmin } from "@/lib/auth/getUser";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import Link from "next/link";
import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">Lamperoma</span>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
              관리자
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/admin" className="text-gray-700 hover:text-gray-900">
              대시보드
            </Link>
            <Link href="/admin/users" className="text-gray-700 hover:text-gray-900">
              사용자 관리
            </Link>
            <Link href="/admin/teachers" className="text-gray-700 hover:text-gray-900">
              원장
            </Link>
            <Link href="/admin/teachers/invites" className="text-gray-700 hover:text-gray-900">
              원장 초대
            </Link>
            <Link href="/admin/students" className="text-gray-700 hover:text-gray-900">
              수강생
            </Link>
            <NotificationBell />
            <form action="/auth/signout" method="post">
              <button className="text-gray-400 hover:text-gray-900">로그아웃</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
