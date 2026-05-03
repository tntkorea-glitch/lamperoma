import { requireTeacher } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureCourseAction, updateCourseStatusAction, updateCourseLinksAction } from "./actions";
import { parseCourseLinks } from "@/lib/courseLinks";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { teacherId } = await requireTeacher();
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .eq("teacher_id", teacherId!)
    .maybeSingle();

  if (!student) notFound();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, total_sessions, status, links, course_sessions(id, session_no, status, scheduled_at, lesson_logs(id, title, published_at))")
    .eq("student_id", id)
    .eq("teacher_id", teacherId!)
    .order("created_at", { ascending: false });

  const activeCourse = courses?.find((c) => c.status === "active") ?? courses?.[0];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/teacher" className="text-xs text-gray-500 hover:underline">
          ← 대시보드
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{student.name}</h1>
        <p className="text-sm text-gray-500">
          {student.email} {student.phone ? `· ${student.phone}` : ""}
        </p>
      </div>

      {!activeCourse ? (
        <form
          action={ensureCourseAction}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
        >
          <input type="hidden" name="student_id" value={student.id} />
          <h2 className="mb-4 text-lg font-semibold">수강 과정 개설</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-700">과정명</span>
              <input
                name="title"
                defaultValue="네일 아크릴 기본 과정"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-700">총 회차</span>
              <input
                name="total_sessions"
                type="number"
                defaultValue={10}
                min={1}
                max={50}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <button className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
            과정 만들기
          </button>
        </form>
      ) : (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">{activeCourse.title}</h2>
              <p className="text-xs text-gray-500">
                총 {activeCourse.total_sessions}회차 · <StatusLabel status={activeCourse.status} />
              </p>
            </div>
            <form action={updateCourseStatusAction} className="flex items-center gap-2">
              <input type="hidden" name="course_id" value={activeCourse.id} />
              <input type="hidden" name="student_id" value={student.id} />
              <select
                name="status"
                defaultValue={activeCourse.status}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs"
              >
                <option value="active">진행중</option>
                <option value="paused">일시중지</option>
                <option value="completed">완료</option>
                <option value="cancelled">취소</option>
              </select>
              <button
                type="submit"
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                변경
              </button>
            </form>
          </div>

          <ul className="space-y-2">
            {[...Array(activeCourse.total_sessions)].map((_, idx) => {
              const no = idx + 1;
              const session = activeCourse.course_sessions?.find(
                (s) => s.session_no === no,
              );
              const log = session?.lesson_logs as
                | Array<{ id: string; title: string | null; published_at: string | null }>
                | undefined;
              const hasLog = log && log.length > 0;
              const isPublished = hasLog && log[0]?.published_at;

              return (
                <li key={no}>
                  <Link
                    href={
                      session
                        ? `/teacher/sessions/${session.id}`
                        : `/teacher/students/${student.id}/sessions/new?no=${no}&course_id=${activeCourse.id}`
                    }
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm transition hover:border-gray-400"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold">
                        {no}
                      </span>
                      <span className="font-medium">
                        {log?.[0]?.title ?? `${no}회차 수업`}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {isPublished
                        ? "✓ 일지 공개됨"
                        : hasLog
                          ? "임시저장"
                          : "일지 작성 전"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {activeCourse && (
        <CourseLinkEditor
          courseId={activeCourse.id}
          studentId={student.id}
          links={parseCourseLinks(activeCourse.links)}
        />
      )}
    </div>
  );
}

function CourseLinkEditor({
  courseId,
  studentId,
  links,
}: {
  courseId: string;
  studentId: string;
  links: ReturnType<typeof parseCourseLinks>;
}) {
  const fields = [
    { key: "consultation_form", label: "수강 상담 설문지" },
    { key: "course_design", label: "수강 설계" },
    { key: "application_form", label: "수강 신청서" },
    { key: "oneday_instagram", label: "인스타그램 원데이 클래스" },
    { key: "oneday_photo", label: "사진/영상 원데이 클래스" },
    { key: "graduation_survey", label: "졸업 설문지" },
    { key: "model_practice", label: "졸업 후 모델 실습" },
    { key: "advanced_training", label: "보수 교육" },
  ] as const;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 className="mb-4 text-lg font-semibold">수강생 링크 설정</h2>
      <form action={updateCourseLinksAction} className="space-y-3">
        <input type="hidden" name="course_id" value={courseId} />
        <input type="hidden" name="student_id" value={studentId} />
        {fields.map(({ key, label }) => (
          <label key={key} className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
            <input
              name={key}
              type="url"
              defaultValue={(links as Record<string, string | undefined>)[key] ?? ""}
              placeholder="https://..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            />
          </label>
        ))}
        <button
          type="submit"
          className="mt-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
        >
          링크 저장
        </button>
      </form>
    </div>
  );
}

function StatusLabel({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "진행중", cls: "text-emerald-600" },
    paused: { label: "일시중지", cls: "text-yellow-600" },
    completed: { label: "완료", cls: "text-gray-500" },
    cancelled: { label: "취소", cls: "text-red-500" },
  };
  const s = map[status] ?? { label: status, cls: "text-gray-500" };
  return <span className={s.cls}>{s.label}</span>;
}
