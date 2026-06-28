import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Printer,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export type DashboardPeriod =
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "ytd"
  | "custom";

export interface DashboardBranch {
  id: number | string;
  name: string;
}

export interface DashboardHighlight {
  label: string;
  value: string;
  helper: string;
}

interface DashboardHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  branches?: DashboardBranch[];
  branchId?: string;
  onBranchChange?: (value: string) => void;
  onExport: () => void;
  onPrint: () => void;
  highlights?: DashboardHighlight[];
}

export function DashboardHeader({
  eyebrow,
  title,
  description,
  period,
  onPeriodChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  branches = [],
  branchId = "",
  onBranchChange,
  onExport,
  onPrint,
  highlights = [],
}: DashboardHeaderProps) {
  return (
    <section className="relative text-slate-800 dark:text-white pb-2 print:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200/60 dark:border-slate-800/60">
        
        {/* Title and Description */}
        <div className="text-left space-y-2.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 dark:border-orange-500/25 bg-orange-50 dark:bg-orange-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 print:hidden">
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 justify-start md:justify-end print:hidden">
          {branches.length > 0 && onBranchChange && (
            <ControlSelect
              value={branchId}
              onChange={onBranchChange}
              options={[
                { value: "", label: "Tất cả chi nhánh" },
                ...branches.map((branch) => ({
                  value: String(branch.id),
                  label: branch.name,
                })),
              ]}
            />
          )}

          <ControlSelect
            value={period}
            onChange={(value) => onPeriodChange(value as DashboardPeriod)}
            icon={<CalendarDays className="h-4 w-4 text-slate-400 dark:text-slate-500" />}
            options={[
              { value: "today", label: "Hôm nay" },
              { value: "last_7_days", label: "7 ngày qua" },
              { value: "last_30_days", label: "30 ngày qua" },
              { value: "ytd", label: "Năm nay" },
              { value: "custom", label: "Tùy chọn" },
            ]}
          />

          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 px-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 shadow-sm transition"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Xuất báo cáo</span>
          </button>
          
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-orange-500/10 transition active:scale-[0.98]"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">In PDF</span>
          </button>
        </div>
      </div>

      {/* Highlights Strip and Custom Date Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        {highlights.length > 0 ? (
          <div className="flex flex-wrap items-center gap-4 md:gap-8 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex-1 max-w-4xl text-left">
            {highlights.slice(0, 3).map((item) => (
              <div key={item.label} className="min-w-[140px] flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                  {item.label}
                </p>
                <p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white tracking-tight sm:text-xl">
                  {item.value}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500 truncate font-medium">
                  {item.helper}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {period === "custom" && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-3 rounded-2xl shadow-sm print:hidden shrink-0 self-start sm:self-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">Từ ngày</span>
            <DateInput value={dateFrom} onChange={onDateFromChange} />
            <span className="text-slate-400 font-bold">→</span>
            <DateInput value={dateTo} onChange={onDateToChange} />
          </div>
        )}
      </div>
    </section>
  );
}

function ControlSelect({
  value,
  onChange,
  options,
  icon,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  icon?: ReactNode;
}) {
  const selected = options.find((option) => option.value === value) || options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-10 min-w-[142px] items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-850 data-[state=open]:border-orange-500/40"
        >
          {icon}
          <span className="truncate">{selected?.label}</span>
          <ChevronDown className="ml-auto h-4 w-4 text-orange-500 transition duration-200 [[data-state=open]_&]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="z-[100] min-w-[190px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 text-slate-700 shadow-xl"
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => onChange(option.value)}
              className={`cursor-pointer rounded-lg px-3 py-2 text-xs outline-none transition ${
                isSelected
                  ? "bg-orange-50 dark:bg-orange-500/10 font-bold text-orange-600 dark:text-orange-400"
                  : "text-slate-600 dark:text-slate-400 focus:bg-orange-50 dark:focus:bg-orange-500/10 focus:text-orange-600 dark:focus:text-orange-400"
              }`}
            >
              <span>{option.label}</span>
              {isSelected && <Check className="ml-auto h-4 w-4 text-orange-500" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-800 dark:text-white outline-none focus:border-orange-500/50"
    />
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  tone: "orange" | "emerald" | "amber" | "rose";
  progress?: number;
}

const metricTone = {
  orange: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-orange-100/50 dark:ring-orange-500/10",
  emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-100/50 dark:ring-emerald-500/10",
  amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-100/50 dark:ring-amber-500/10",
  rose: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-100/50 dark:ring-rose-500/10",
};

const progressTone = {
  orange: "bg-orange-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
  progress,
}: MetricCardProps) {
  return (
    <div className="bg-slate-900/[0.01] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.03] dark:ring-white/[0.05] p-1.5 rounded-[22px] w-full text-left">
      <article className="group rounded-[16px] border border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-slate-900 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition duration-300 hover:scale-[1.01] hover:shadow-[0_15px_40px_rgba(0,0,0,0.04)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {label}
            </p>
            <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-905 dark:text-white">
              {value}
            </p>
          </div>
          <div className={`rounded-xl p-2.5 ring-4 ring-offset-0 transition group-hover:scale-105 ${metricTone[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{helper}</p>
        {progress !== undefined && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${progressTone[tone]}`}
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        )}
      </article>
    </div>
  );
}

export function ChartPanel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-slate-900/[0.01] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.03] dark:ring-white/[0.05] p-2 rounded-[2rem] ${className}`}>
      <section className="bg-white dark:bg-slate-900 rounded-[calc(2rem-0.5rem)] border border-slate-200/40 dark:border-slate-800/40 shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden">
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 px-5 py-4">
          <div className="text-left">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
          {action}
        </header>
        <div className="p-4 sm:p-5">{children}</div>
      </section>
    </div>
  );
}

export function ChartTooltip({
  active,
  payload,
  label,
  currency = false,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string;
  currency?: boolean;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-40 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3 shadow-xl backdrop-blur">
      <p className="mb-2 text-xs font-semibold text-slate-800 dark:text-white text-left">{label}</p>
      <div className="space-y-1.5">
        {payload.map((item, index) => (
          <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-5 text-xs">
            <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <i className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <strong className="font-semibold text-slate-900 dark:text-white">
              {currency
                ? `${Number(item.value || 0).toLocaleString("vi-VN")} ₫`
                : Number(item.value || 0).toLocaleString("vi-VN")}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <div className="relative mx-auto h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-orange-500" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

