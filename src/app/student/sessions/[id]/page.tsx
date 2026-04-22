import { requireStudent } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CommentThread } from "@/components/session/CommentThread";

export default async function StudentSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStudent();
  const { id: sessionId } = await params;

  const supabase = createSupabaseAdminClient();

  const { data: session } = await supabase
    .from("course_sessions")
    .select("id, session_no, scheduled_at, course:courses(title, total_sessions)")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) notFound();
  const course = Array.isArray(session.course) ? session.course[0] : session.course;

  const { data: log } = await supabase
    .from("lesson_logs")
    .select("*")
    .eq("session_id", sessionId)
    .not("published_at", "is", null)
    .maybeSingle();

  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/student" className="text-xs text-gray-500 hover:underline">
          ← 수강 목록
        </Link>
        <h1 className="mt-1 text-2xl font-bold">
          {session.session_no}회차
          {course?.total_sessions && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              / 총 {course.total_sessions}회
            </span>
          )}
        </h1>
      </div>

      {!log ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm ring-1 ring-black/5">
          원장님이 아직 일지를 등록하지 않았어요.
        </div>
      ) : (
        <article className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          {log.title && <h2 className="text-xl font-semibold">{log.title}</h2>}
          {log.content && (
            <Section label="오늘 배운 내용" content={log.content} />
          )}
          {log.strengths && <Section label="잘한 점" content={log.strengths} />}
          {log.improvements && (
            <Section label="개선할 점" content={log.improvements} />
          )}
          {log.next_prep && (
            <Section label="다음 회차 준비물" content={log.next_prep} />
          )}
          {log.images?.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-medium text-gray-700">실습 사진</h3>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {log.images.map((url: string, i: number) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt={`사진 ${i + 1}`}
                    className="aspect-square rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400">
            등록: {new Date(log.published_at!).toLocaleString("ko-KR")}
            {log.updated_at !== log.created_at && " (수정됨)"}
          </p>
        </article>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">질문 & 피드백</h2>
        <CommentThread
          sessionId={sessionId}
          role="student"
          initialComments={comments ?? []}
        />
      </div>
    </div>
  );
}

function Section({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-medium text-gray-700">{label}</h3>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
        {content}
      </p>
    </div>
  );
}
