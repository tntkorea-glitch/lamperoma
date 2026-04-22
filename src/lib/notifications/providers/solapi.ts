import type {
  DeliveryResult,
  NotificationPayload,
  NotificationProvider,
} from "../types";

/**
 * Solapi SMS + 알림톡 프로바이더 (스켈레톤)
 *
 * 지금은 env가 비어 있으면 no-op. Solapi 가입 후 아래 환경변수 채우면 즉시 동작:
 * - SOLAPI_API_KEY
 * - SOLAPI_API_SECRET
 * - SOLAPI_SENDER (인증된 발신번호)
 * - SOLAPI_KAKAO_PFID (선택, 있으면 알림톡 시도 → 실패 시 SMS fallback)
 *
 * 참고: https://developers.solapi.com/references/messages/send
 */
export function buildSmsProvider(): NotificationProvider {
  return {
    channel: "sms",
    async send(payload: NotificationPayload): Promise<DeliveryResult> {
      const apiKey = process.env.SOLAPI_API_KEY;
      const apiSecret = process.env.SOLAPI_API_SECRET;
      const sender = process.env.SOLAPI_SENDER;
      const pfId = process.env.SOLAPI_KAKAO_PFID;

      if (!apiKey || !apiSecret || !sender) {
        return {
          channel: "sms",
          delivered: false,
          skipped: true,
          reason: "Solapi env not configured",
        };
      }
      if (!payload.phone) {
        return {
          channel: "sms",
          delivered: false,
          skipped: true,
          reason: "no recipient phone",
        };
      }

      const text = buildText(payload);
      const message: Record<string, unknown> = {
        to: payload.phone.replace(/\D/g, ""),
        from: sender.replace(/\D/g, ""),
        text,
      };

      // 알림톡 프로필이 있으면 kakaoOptions 추가 (승인된 템플릿 필요)
      if (pfId) {
        message.kakaoOptions = {
          pfId,
          templateId: payload.type,
          disableSms: false,
        };
      }

      try {
        const res = await fetch(
          "https://api.solapi.com/messages/v4/send",
          {
            method: "POST",
            headers: {
              Authorization: buildAuthHeader(apiKey, apiSecret),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
          },
        );

        if (!res.ok) {
          const text = await res.text();
          return { channel: "sms", delivered: false, reason: text };
        }
        const data = (await res.json()) as { messageId?: string };
        return { channel: "sms", delivered: true, providerId: data.messageId };
      } catch (err) {
        return {
          channel: "sms",
          delivered: false,
          reason: err instanceof Error ? err.message : "unknown",
        };
      }
    },
  };
}

function buildText(payload: NotificationPayload): string {
  const lines = [`[Lamperoma] ${payload.title}`];
  if (payload.body) lines.push(payload.body);
  if (payload.link) lines.push(payload.link);
  return lines.join("\n");
}

function buildAuthHeader(apiKey: string, apiSecret: string): string {
  // Solapi HMAC auth — 간단 구현
  // 실제 배포 시엔 crypto HMAC-SHA256 사용 권장. 여기선 단순화.
  const date = new Date().toISOString();
  const salt = Math.random().toString(36).slice(2, 14);
  const { createHmac } = require("crypto") as typeof import("crypto");
  const signature = createHmac("sha256", apiSecret)
    .update(date + salt)
    .digest("hex");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

export const smsProvider = buildSmsProvider();
