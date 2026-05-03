"use client";

import { useEffect, useState } from "react";

interface Elapsed {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcElapsed(from: Date): Elapsed {
  const diff = Math.max(0, Date.now() - from.getTime());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

const BOXES = ["DAYS", "HOURS", "MINUTES", "SECONDS"] as const;

export function DdayCounter({ startDate }: { startDate: string }) {
  const from = new Date(startDate);
  const [elapsed, setElapsed] = useState<Elapsed>(() => calcElapsed(from));

  useEffect(() => {
    const id = setInterval(() => setElapsed(calcElapsed(from)), 1_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate]);

  const values = [elapsed.days, elapsed.hours, elapsed.minutes, elapsed.seconds];

  return (
    <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
      <p className="mb-5 text-sm font-semibold tracking-wide text-rose-500">
        ♥ 람페로마랑 함께 한 지 ♥
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {BOXES.map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <div className="flex h-[88px] w-[88px] items-center justify-center rounded-xl bg-[#bdc3c7]">
              <span className="font-black text-5xl leading-none tabular-nums text-[#183059]">
                {String(values[i]).padStart(2, "0")}
              </span>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-[4px] text-gray-500">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
