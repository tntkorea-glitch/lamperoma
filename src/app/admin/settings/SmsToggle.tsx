"use client";

import { useState, useTransition } from "react";
import { toggleSmsAction } from "./actions";

export function SmsToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const next = !enabled;
    if (next && !confirm("SMS 발송을 켭니다. 건당 과금되는데 진행할까요?")) return;

    setEnabled(next); // optimistic
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("enabled", next ? "true" : "false");
        await toggleSmsAction(fd);
      } catch (e) {
        setEnabled(!next); // revert
        alert(e instanceof Error ? e.message : "변경 실패");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      role="switch"
      aria-checked={enabled}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-60 ${
        enabled ? "bg-emerald-500" : "bg-gray-300"
      }`}
    >
      <span
        aria-hidden
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
