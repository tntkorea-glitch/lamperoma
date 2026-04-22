"use client";

import { uploadLessonImagesAction } from "@/lib/storage/upload";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { addCommentAction } from "./actions";

type Comment = {
  id: string;
  author_id: string;
  author_role: string;
  body: string;
  images: string[];
  created_at: string;
};

export function CommentThread({
  sessionId,
  role,
  initialComments,
}: {
  sessionId: string;
  role: "teacher" | "student";
  initialComments: Comment[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [initialComments.length]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("session_id", sessionId);
      fd.set("prefix", "comment");
      for (const f of Array.from(files)) fd.append("files", f);
      const urls = await uploadLessonImagesAction(fd);
      setImages((p) => [...p, ...urls]);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!body.trim() && images.length === 0) return;
    const fd = new FormData();
    fd.set("session_id", sessionId);
    fd.set("role", role);
    fd.set("body", body);
    fd.set("images", JSON.stringify(images));
    startTransition(async () => {
      await addCommentAction(fd);
      setBody("");
      setImages([]);
      router.refresh();
    });
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="max-h-[500px] space-y-3 overflow-y-auto p-4">
        {initialComments.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            아직 코멘트가 없어요. 궁금한 점이나 피드백을 남겨보세요.
          </p>
        ) : (
          initialComments.map((c) => <CommentBubble key={c.id} comment={c} myRole={role} />)
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-gray-100 p-3">
        {images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {images.map((url) => (
              <div key={url} className="group relative h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((p) => p.filter((u) => u !== url))}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/60 px-1.5 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              role === "student"
                ? "질문이나 피드백 요청을 남겨보세요"
                : "답변이나 피드백을 남겨주세요"
            }
            rows={2}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
            }}
          />
          <label className="cursor-pointer rounded-lg border border-gray-300 bg-white p-2 text-xs text-gray-600 hover:bg-gray-50">
            📎
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploading}
            />
          </label>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || uploading}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            등록
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">Ctrl/⌘+Enter 로 등록</p>
      </div>
    </div>
  );
}

function CommentBubble({ comment, myRole }: { comment: Comment; myRole: string }) {
  const isMine = comment.author_role === myRole;
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
          isMine ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <div className={`mb-0.5 text-[10px] ${isMine ? "text-gray-300" : "text-gray-500"}`}>
          {comment.author_role === "teacher" ? "원장" : "수강생"} ·{" "}
          {new Date(comment.created_at).toLocaleString("ko-KR", {
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        {comment.body && <p className="whitespace-pre-wrap">{comment.body}</p>}
        {comment.images?.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-1">
            {comment.images.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className="h-20 w-full rounded-md object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
