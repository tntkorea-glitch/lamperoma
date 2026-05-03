import { requireStudent } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DdayCounter } from "@/components/DdayCounter";
import { parseCourseLinks } from "@/lib/courseLinks";
import Link from "next/link";

export default async function StudentDashboard() {
  const { studentId } = await requireStudent();
  const supabase = createSupabaseAdminClient();

  const [{ data: student }, { data: courses }] = await Promise.all([
    supabase.from("students").select("name").eq("id", studentId!).maybeSingle(),
    supabase
      .from("courses")
      .select(
        "id, title, total_sessions, status, started_at, created_at, links, teacher:teachers(name, salon_name), course_sessions(id, session_no, status, lesson_logs(id, title, published_at, updated_at))",
      )
      .eq("student_id", studentId!)
      .order("created_at", { ascending: false }),
  ]);

  const activeCourse = courses?.find((c) => c.status === "active") ?? courses?.[0];
  const teacher =
    activeCourse &&
    (Array.isArray(activeCourse.teacher) ? activeCourse.teacher[0] : activeCourse.teacher);

  if (!activeCourse) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
        <div className="mb-3 text-4xl">🎨</div>
        <p className="text-sm text-gray-600">
          원장님이 수강 과정을 개설하시면 여기에 나타날 거예요.
        </p>
      </div>
    );
  }

  const links = parseCourseLinks(activeCourse.links);
  const sessionsByNo = new Map(
    (activeCourse.course_sessions ?? []).map((s) => [s.session_no, s]),
  );
  const ddayStart = activeCourse.started_at
    ? `${activeCourse.started_at}T00:00:00`
    : activeCourse.created_at;

  const isCompleted = activeCourse.status === "completed";
  const hasConsultLinks =
    links.consultation_form || links.course_design || links.application_form;
  const hasOnedayLinks = links.oneday_instagram || links.oneday_photo;
  const hasGradLinks =
    links.graduation_survey || links.model_practice || links.advanced_training;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {teacher?.salon_name ?? teacher?.name ?? "Lamperoma Beauty Academy"}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          {student?.name ?? ""}님의 수강 일지
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">{activeCourse.title}</p>
      </div>

      {/* D-Day 카운터 */}
      <DdayCounter startDate={ddayStart} />

      {/* 수강 상담/설계/신청서 */}
      {hasConsultLinks && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-3 border-l-4 border-gray-300 pl-3 text-sm font-semibold text-gray-700">
            수강 상담/설계/신청서 다시보기
          </h2>
          <div className="flex flex-col gap-2">
            {links.consultation_form && (
              <LinkButton num={1} href={links.consultation_form} label="수강 상담 설문지 다시보기" />
            )}
            {links.course_design && (
              <LinkButton num={2} href={links.course_design} label="수강 설계 다시보기" />
            )}
            {links.application_form && (
              <LinkButton num={3} href={links.application_form} label="수강 신청서 다시보기" />
            )}
          </div>
        </div>
      )}

      {/* 원데이 클래스 안내 */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-3 border-l-4 border-gray-300 pl-3 text-sm font-semibold text-gray-700">
          람페로마 수강생 전용 원데이 클래스
        </h2>
        <p className="mb-3 text-xs leading-relaxed text-gray-600">
          람페로마 수강생 전용 원데이 클래스는 1회차 수업 14일 전까지 신청 완료해 주셔야
          수업이 가능합니다. 신청서를 제출하신 수강생분은 카톡으로 알려주세요 :)
        </p>
        <div className="flex flex-col gap-2">
          {hasOnedayLinks ? (
            <>
              {links.oneday_instagram && (
                <a
                  href={links.oneday_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium hover:border-gray-400"
                >
                  <span className="text-rose-500">♥</span>
                  인스타그램 기본 마케팅 원데이 클래스 (1회차 수업 시 진행)
                </a>
              )}
              {links.oneday_photo && (
                <a
                  href={links.oneday_photo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium hover:border-gray-400"
                >
                  <span className="text-rose-500">♥</span>
                  사진/영상 촬영 및 편집 원데이 클래스 (아크릴 체험 시 진행)
                </a>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-2 opacity-50">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-500">
                <span className="text-rose-400">♥</span>
                인스타그램 기본 마케팅 원데이 클래스 (1회차 수업 시 진행)
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-500">
                <span className="text-rose-400">♥</span>
                사진/영상 촬영 및 편집 원데이 클래스 (아크릴 체험 시 진행)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 수강 회차 목록 */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-3 border-l-4 border-gray-300 pl-3 text-sm font-semibold text-gray-700">
          람페로마 아키텍처 아크릴 수강
        </h2>
        <ul className="space-y-2">
          {[...Array(activeCourse.total_sessions)].map((_, i) => {
            const no = i + 1;
            const s = sessionsByNo.get(no);
            const log = s?.lesson_logs as
              | Array<{ id: string; title: string | null; published_at: string | null; updated_at: string }>
              | undefined;
            const published = log?.[0]?.published_at;
            const title = log?.[0]?.title ?? `${no}회차 수업`;
            const disabled = !s || !published;

            return (
              <li key={no}>
                <Link
                  href={disabled ? "#" : `/student/sessions/${s!.id}`}
                  aria-disabled={disabled}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
                    disabled
                      ? "pointer-events-none border-gray-100 bg-gray-50 text-gray-400"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                        disabled ? "bg-gray-200 text-gray-400" : "bg-gray-900 text-white"
                      }`}
                    >
                      {no}
                    </span>
                    <span className="font-medium">{title}</span>
                  </div>
                  {disabled ? (
                    <span className="text-xs">아직 등록 전</span>
                  ) : (
                    <span className="text-xs text-gray-500">
                      {new Date(published!).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 수강 종료 섹션 */}
      {(isCompleted || hasGradLinks) && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-3 border-l-4 border-gray-300 pl-3 text-sm font-semibold text-gray-700">
            람페로마 아키텍처 아크릴 수강 종료
          </h2>
          <div className="flex flex-col gap-2">
            {links.graduation_survey ? (
              <LinkButton num={1} href={links.graduation_survey} label="졸업 설문지 작성하러 가기" />
            ) : (
              <span className="rounded-lg border border-gray-100 px-4 py-2.5 text-sm text-gray-400">
                1 졸업 설문지 작성하러 가기 (준비 중)
              </span>
            )}
            {links.model_practice ? (
              <LinkButton num={2} href={links.model_practice} label="졸업 후 추가 모델 실습 신청" />
            ) : (
              <span className="rounded-lg border border-gray-100 px-4 py-2.5 text-sm text-gray-400">
                2 졸업 후 추가 모델 실습 신청 (준비 중)
              </span>
            )}
            {links.advanced_training ? (
              <LinkButton num={3} href={links.advanced_training} label="졸업 후 보수 교육 신청" />
            ) : (
              <span className="rounded-lg border border-gray-100 px-4 py-2.5 text-sm text-gray-400">
                3 졸업 후 보수 교육 신청 (신청서 양식 만드는 중)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LinkButton({ num, href, label }: { num: number; href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium transition hover:border-gray-400"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
        {num}
      </span>
      {label}
    </a>
  );
}
