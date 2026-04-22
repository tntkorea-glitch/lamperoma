"use client";

import { useState, useTransition } from "react";
import {
  assignStudentAction,
  demoteTeacherAction,
  promoteToTeacherAction,
  unassignStudentAction,
} from "./actions";

type User = { id: string; email: string; name: string; created_at: string };
type Role = "admin" | "teacher" | "student" | "unassigned";

export function UserRow({
  user,
  role,
  studentTeacher,
  teacherOptions,
}: {
  user: User;
  role: Role;
  studentTeacher?: { name: string; salon_name: string | null };
  teacherOptions: Array<{ id: string; label: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState(teacherOptions[0]?.id ?? "");

  const runAction = (action: (fd: FormData) => Promise<void>, fd: FormData, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setError(null);
    startTransition(async () => {
      try {
        await action(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류");
      }
    });
  };

  const base = (action: string) => {
    const fd = new FormData();
    fd.set("user_id", user.id);
    if (action === "assign") fd.set("teacher_id", teacherId);
    return fd;
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-5 py-3">
        <p className="font-medium text-gray-900">{user.name}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
      </td>
      <td className="px-5 py-3">
        <RoleBadge role={role} />
        {role === "student" && studentTeacher && (
          <p className="mt-1 text-xs text-gray-500">
            → {studentTeacher.name}
            {studentTeacher.salon_name && ` (${studentTeacher.salon_name})`}
          </p>
        )}
      </td>
      <td className="px-5 py-3">
        {role === "admin" ? (
          <span className="text-xs text-gray-400">관리자 (변경 불가)</span>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {role !== "teacher" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    promoteToTeacherAction,
                    base("promote"),
                    role === "student"
                      ? "수강생 데이터가 모두 삭제되고 원장으로 변경됩니다. 진행할까요?"
                      : undefined,
                  )
                }
                className="rounded-md bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              >
                원장으로 지정
              </button>
            )}
            {role === "teacher" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    demoteTeacherAction,
                    base("demote"),
                    "원장 권한을 해제합니다. 진행할까요?",
                  )
                }
                className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                원장 해제
              </button>
            )}
            {role !== "teacher" && role !== "student" && teacherOptions.length > 0 && (
              <>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                >
                  {teacherOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={isPending || !teacherId}
                  onClick={() => runAction(assignStudentAction, base("assign"))}
                  className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  수강생 배정
                </button>
              </>
            )}
            {role === "student" && (
              <>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                >
                  {teacherOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={isPending || !teacherId}
                  onClick={() =>
                    runAction(
                      assignStudentAction,
                      base("assign"),
                      "원장을 변경합니다. 진행할까요?",
                    )
                  }
                  className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  원장 변경
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    runAction(
                      unassignStudentAction,
                      base("unassign"),
                      "수강생 등록을 해제하면 관련 과정·일지도 모두 삭제됩니다. 진행할까요?",
                    )
                  }
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  해제
                </button>
              </>
            )}
          </div>
        )}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
      <td className="px-5 py-3 text-right text-xs text-gray-500">
        {new Date(user.created_at).toLocaleDateString("ko-KR")}
      </td>
    </tr>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const map = {
    admin: { label: "관리자", cls: "bg-violet-100 text-violet-700" },
    teacher: { label: "원장", cls: "bg-blue-100 text-blue-700" },
    student: { label: "수강생", cls: "bg-emerald-100 text-emerald-700" },
    unassigned: { label: "미배정", cls: "bg-gray-100 text-gray-600" },
  };
  const s = map[role];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}
