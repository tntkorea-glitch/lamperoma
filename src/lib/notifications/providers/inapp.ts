import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  DeliveryResult,
  NotificationPayload,
  NotificationProvider,
} from "../types";

export const inappProvider: NotificationProvider = {
  channel: "inapp",
  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("notifications").insert({
      user_id: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body ?? null,
      link: payload.link ?? null,
    });

    if (error) {
      return { channel: "inapp", delivered: false, reason: error.message };
    }
    return { channel: "inapp", delivered: true };
  },
};
