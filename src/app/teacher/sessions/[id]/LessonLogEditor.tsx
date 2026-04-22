"use client";

import { uploadLessonImagesAction } from "@/lib/storage/upload";
import { useState, useTransition } from "react";
import { publishLessonLogAction, saveLessonLogAction } from "./actions";

type LogRow = {
  id: string;
  title: string | null;
  content: string;
  topics: string[];
  strengths: string | null;
  improvements: string | null;
  next_prep: string | null;
  images: string[];
  published_at: string | null;
};

export function LessonLogEditor({
  sessionId,
  studentId,
  studentEmail,
  studentPhone,
  initial,
}: {
  sessionId: string;
  studentId: string;
  studentEmail: string;
  studentPhone: string | null;
  initial: LogRow | null;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [strengths, setStrengths] = useState(initial?.strengths ?? "");
  const [improvements, setImprovements] = useState(initial?.improvements ?? "");
  const [nextPrep, setNextPrep] = useState(initial?.next_prep ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isPublished = !!initial?.published_at;

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }

    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${user.id}/${sessionId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("lesson-images")
        .upload(path, file, { upsert: false });
      if (error) {
        setStatus(`이미지 업로드 실패: ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from("lesson-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
  };

  const handleSave = (publish: boolean) => {
    const fd = new FormData();
    fd.set("session_id", sessionId);
    fd.set("student_id", studentId);
    fd.set("student_email", studentEmail);
    fd.set("student_phone", studentPhone ?? "");
    fd.set("title", title);
    fd.set("content", content);
    fd.set("strengths", strengths);
    fd.set("improvements", improvements);
    fd.set("next_prep", nextPrep);
    fd.set("images", JSON.stringify(images));

    startTransition(async () => {
      try {
        if (publish) {
          await publishLessonLogAction(fd);
          setStatus("✓ 수강생에게 알림을 보냈습니다");
        } else {
          await saveLessonLogAction(fd);
          setStatus("✓ 임시저장 완료");
        }
      } catch (err) {
        setStatus(err instanceof Error ? err.message : "저장 실패");
      }
    });
  };

  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">수강일지</h2>
        {isPublished && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
            ✓ 공개됨
          </span>
        )}
      </div>

      <Field label="제목">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 2회차 - 아크릴 기초 폼"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </Field>

      <Field label="오늘 배운 내용">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          placeholder="이론 + 실습 진행 내용을 상세히 기록해주세요"
          className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm leading-relaxed"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="잘한 점">
          <textarea
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            rows={3}
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="개선할 점">
          <textarea
            value={improvements}
            onChange={(e) => setImprovements(e.target.value)}
            rows={3}
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <Field label="다음 회차 준비물">
        <input
          value={nextPrep}
          onChange={(e) => setNextPrep(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </Field>

      <Field label="실습 사진">
        <div className="space-y-3">
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
              {images.map((url, i) => (
                <div key={url} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`실습사진 ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((p) => p.filter((u) => u !== url))}
                    className="absolute right-1 top-1 rounded-full bg-black/60 px-2 text-xs text-white opacity-0 transition group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="inline-block cursor-pointer rounded-lg border border-dashed border-gray-300 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50">
            {uploading ? "업로드 중..." : "+ 사진 추가"}
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploading}
            />
          </label>
        </div>
      </Field>

      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={isPending}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          임시저장
        </button>
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={isPending}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {isPublished ? "수정하고 다시 알림" : "등록하고 수강생에게 알림"}
        </button>
        {status && <span className="text-xs text-gray-500">{status}</span>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}
