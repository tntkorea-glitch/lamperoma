import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { inappProvider } from "./providers/inapp";
import { emailProvider } from "./providers/email";
import { smsProvider } from "./providers/solapi";
import type { NotificationPayload, DeliveryResult } from "./types";

/**
 * 알림 전송 — 모든 채널을 병렬로 시도하고 결과 반환.
 * 인앱 알림은 항상 생성되고, 각 채널은 env 없으면 skip.
 * DB의 notifications row 에 sent_*_at 을 업데이트해서 이력 보관.
 */
export async function sendNotification(
  payload: NotificationPayload,
): Promise<DeliveryResult[]> {
  const results = await Promise.all([
    inappProvider.send(payload),
    emailProvider.send(payload),
    smsProvider.send(payload),
  ]);

  const supabase = createSupabaseAdminClient();
  const { data: row } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", payload.userId)
    .eq("type", payload.type)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (row) {
    const patch: Record<string, string> = {};
    for (const r of results) {
      if (r.delivered) {
        if (r.channel === "email") patch.sent_email_at = new Date().toISOString();
        if (r.channel === "sms") patch.sent_sms_at = new Date().toISOString();
        if (r.channel === "kakao") patch.sent_kakao_at = new Date().toISOString();
      }
    }
    if (Object.keys(patch).length > 0) {
      await supabase.from("notifications").update(patch).eq("id", row.id);
    }
  }

  return results;
}
