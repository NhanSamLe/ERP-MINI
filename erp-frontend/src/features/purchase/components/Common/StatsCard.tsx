import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  trend?: string;
  color?: "orange" | "purple" | "green" | "red" | "blue";
}

const COLOR_MAP = {
  orange: "bg-orange-100 text-orange-600",
  purple: "bg-purple-100 text-purple-600",
  green: "bg-green-100 text-green-600",
  red: "bg-red-100 text-red-600",
  blue: "bg-blue-100 text-blue-600",
};

export function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  color = "orange",
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${COLOR_MAP[color]}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {trend && <p className="text-xs text-green-600 mt-0.5">{trend}</p>}
      </div>
    </div>
  );
}
