"use server";

import { getAuthedUser } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * 클라이언트에서 FormData로 이미지 파일을 업로드하면 서버가 service_role 로 Supabase Storage에 저장 후 public URL 반환.
 * RLS를 우회하지만 업로드 전 역할 검증.
 */
export async function uploadLessonImagesAction(formData: FormData): Promise<string[]> {
  const { user, role } = await getAuthedUser();
  if (role !== "teacher" && role !== "student") {
    throw new Error("권한 없음");
  }

  const sessionId = formData.get("session_id") as string;
  if (!sessionId) throw new Error("session_id 가 필요합니다");

  const prefix = (formData.get("prefix") as string) || "";
  const files = formData.getAll("files") as File[];
  if (files.length === 0) return [];

  const supabase = createSupabaseAdminClient();
  const urls: string[] = [];

  for (const file of files) {
    if (!(file instanceof File)) continue;
    const ext = file.name.split(".").pop() ?? "bin";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${user.id}/${sessionId}/${prefix ? prefix + "-" : ""}${safeName}`;

    const { error } = await supabase.storage
      .from("lesson-images")
      .upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (error) throw error;

    const { data } = supabase.storage.from("lesson-images").getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}
