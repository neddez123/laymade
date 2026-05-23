"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { verticals, type Vertical } from "@/app/data/templates";

type FilterValue = "all" | Vertical;

export function TemplateFilterStrip() {
  const router = useRouter();
  const params = useSearchParams();
  const current = (params.get("vertical") as FilterValue) || "all";

  function setFilter(value: FilterValue) {
    const search = new URLSearchParams(params.toString());
    if (value === "all") {
      search.delete("vertical");
    } else {
      search.set("vertical", value);
    }
    const qs = search.toString();
    router.push(`/templates${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  const options: { value: FilterValue; label: string }[] = [
    { value: "all", label: "All" },
    ...verticals.map((v) => ({ value: v.id, label: v.label })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-8 mb-12 md:mb-16">
      {options.map((opt) => {
        const active = opt.value === current;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] transition-colors duration-200 ease-out ${
              active
                ? "text-[color:var(--ink)]"
                : "text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]"
            }`}
          >
            <span
              className={`w-1 h-1 rounded-full transition-colors duration-200 ${
                active ? "bg-[color:var(--accent)]" : "bg-transparent"
              }`}
              aria-hidden="true"
            />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
