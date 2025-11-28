import { useState } from "react";
import { TimelineEvent } from "../dto/activity.dto";

export function CompactTimeline({ items }: { items: TimelineEvent[] }) {
  const [expanded, setExpanded] = useState(false);

  const MAX_VISIBLE = 4;
  const visibleItems = expanded ? items : items.slice(0, MAX_VISIBLE);

  return (
    <div className="space-y-4">
      {visibleItems.map((t, idx) => (
        <div key={t.id} className="relative">

          {/* connector line */}
          {idx !== visibleItems.length - 1 && (
            <div className="absolute left-3 top-6 w-0.5 h-10 bg-gray-200" />
          )}

          {/* timeline item */}
          <div className="flex gap-3">
            {/* dot */}
            <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>

            {/* text */}
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm leading-tight">
                {t.title ?? "Unknown Event"}
              </p>

              {t.description && (
                <p className="text-xs text-gray-600 mt-0.5 leading-snug">
                  {t.description}
                </p>
              )}

              <p className="text-[10px] text-gray-400 mt-0.5">
                {t.created_at
                  ? new Date(t.created_at).toLocaleString("vi-VN")
                  : ""}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Collapse / Expand */}
      {items.length > MAX_VISIBLE && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-orange-600 font-medium hover:underline"
        >
          {expanded ? "Show less ▲" : `Show more (${items.length - MAX_VISIBLE}) ▼`}
        </button>
      )}
    </div>
  );
}