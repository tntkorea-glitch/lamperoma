"use client";

import { useMemo, useState, type ReactNode } from "react";

export function SearchableList<T>({
  items,
  placeholder = "검색...",
  filter,
  render,
  emptyMessage = "검색 결과가 없어요",
}: {
  items: T[];
  placeholder?: string;
  filter: (item: T, query: string) => boolean;
  render: (filtered: T[]) => ReactNode;
  emptyMessage?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => filter(i, q));
  }, [items, query, filter]);

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-900"
      />
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-400 shadow-sm ring-1 ring-black/5">
          {emptyMessage}
        </div>
      ) : (
        render(filtered)
      )}
    </div>
  );
}
