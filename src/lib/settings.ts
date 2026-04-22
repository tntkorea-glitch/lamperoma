import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * app_settings 테이블 읽기/쓰기 헬퍼.
 * key 기반 jsonb value.
 */
export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return (data?.value as T) ?? null;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("app_settings")
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  if (error) throw error;
}

export async function isSmsEnabled(): Promise<boolean> {
  const v = await getSetting<{ enabled: boolean }>("sms_enabled");
  return v?.enabled === true;
}
