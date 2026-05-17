import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  trend?: string;
  trendUp?: boolean;
  color?: "orange" | "purple" | "green" | "red" | "blue" | "amber" | "teal";
}

const COLOR_MAP: Record<
  NonNullable<StatsCardProps["color"]>,
  { bg: string; icon: string; border: string; value: string }
> = {
  orange: {
    bg: "bg-orange-50",
    icon: "bg-orange-100 text-orange-600",
    border: "border-orange-100",
    value: "text-orange-600",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "bg-purple-100 text-purple-600",
    border: "border-purple-100",
    value: "text-purple-600",
  },
  green: {
    bg: "bg-emerald-50",
    icon: "bg-emerald-100 text-emerald-600",
    border: "border-emerald-100",
    value: "text-emerald-600",
  },
  red: {
    bg: "bg-red-50",
    icon: "bg-red-100 text-red-600",
    border: "border-red-100",
    value: "text-red-600",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-100 text-blue-600",
    border: "border-blue-100",
    value: "text-blue-600",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "bg-amber-100 text-amber-600",
    border: "border-amber-100",
    value: "text-amber-600",
  },
  teal: {
    bg: "bg-teal-50",
    icon: "bg-teal-100 text-teal-600",
    border: "border-teal-100",
    value: "text-teal-600",
  },
};

export function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp = true,
  color = "orange",
}: StatsCardProps) {
  const c = COLOR_MAP[color];

  return (
    <div
      className={`relative bg-white rounded-xl border ${c.border} p-5 flex items-center gap-4 hover:shadow-md transition-shadow overflow-hidden`}
    >
      {/* Subtle background accent */}
      <div
        className={`absolute inset-0 ${c.bg} opacity-40 pointer-events-none`}
      />

      {/* Icon */}
      <div
        className={`relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}
      >
        <Icon className="w-6 h-6" />
      </div>

      {/* Content */}
      <div className="relative min-w-0">
        <p className={`text-2xl font-bold ${c.value}`}>{value}</p>
        <p className="text-sm text-gray-500 truncate">{label}</p>
        {trend && (
          <p
            className={`text-xs mt-0.5 font-medium ${trendUp ? "text-emerald-600" : "text-red-500"}`}
          >
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
