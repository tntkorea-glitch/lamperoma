import { requireAdmin } from "@/lib/auth/getUser";
import { getSetting } from "@/lib/settings";
import { SmsToggle } from "./SmsToggle";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const sms = await getSetting<{ enabled: boolean }>("sms_enabled");
  const smsEnabled = sms?.enabled === true;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">시스템 설정</h1>
        <p className="mt-1 text-sm text-gray-500">
          전체 사용자에게 영향을 주는 전역 설정을 관리합니다
        </p>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900">SMS 발송</h2>
            <p className="mt-1 text-sm text-gray-500">
              수강일지 등록·코멘트 시 수강생/원장에게 SMS 자동 발송
            </p>
            <p className="mt-3 text-xs text-gray-400">
              현재 상태:{" "}
              <span className={smsEnabled ? "font-semibold text-emerald-600" : "font-semibold text-gray-500"}>
                {smsEnabled ? "● 사용 중 (건당 17~25원 과금)" : "○ 중지됨"}
              </span>
            </p>
            <p className="mt-1 text-xs text-gray-400">
              이메일·인앱 알림은 이 설정과 무관하게 계속 발송됩니다
            </p>
          </div>
          <SmsToggle initial={smsEnabled} />
        </div>
      </section>
    </div>
  );
}
