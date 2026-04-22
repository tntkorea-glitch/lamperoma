import type {
  DeliveryResult,
  NotificationPayload,
  NotificationProvider,
} from "../types";

export const emailProvider: NotificationProvider = {
  channel: "email",
  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !payload.email) {
      return {
        channel: "email",
        delivered: false,
        skipped: true,
        reason: !apiKey ? "RESEND_API_KEY not set" : "no recipient email",
      };
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Lamperoma <noreply@lamperoma.app>",
          to: [payload.email],
          subject: payload.title,
          html: buildHtml(payload),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return { channel: "email", delivered: false, reason: text };
      }
      const data = (await res.json()) as { id?: string };
      return { channel: "email", delivered: true, providerId: data.id };
    } catch (err) {
      return {
        channel: "email",
        delivered: false,
        reason: err instanceof Error ? err.message : "unknown",
      };
    }
  },
};

function buildHtml(payload: NotificationPayload) {
  const linkHtml = payload.link
    ? `<p><a href="${payload.link}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;border-radius:8px;text-decoration:none;">확인하기</a></p>`
    : "";
  return `
    <div style="font-family:-apple-system,'Pretendard Variable',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
      <h2 style="margin:0 0 12px;font-size:18px;">${escapeHtml(payload.title)}</h2>
      ${payload.body ? `<p style="color:#444;line-height:1.6;white-space:pre-wrap;">${escapeHtml(payload.body)}</p>` : ""}
      ${linkHtml}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <p style="font-size:12px;color:#999;">Lamperoma · 네일 아크릴 수강일지</p>
    </div>
  `;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[c] ?? c;
  });
}
