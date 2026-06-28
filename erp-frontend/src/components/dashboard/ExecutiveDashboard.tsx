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
    <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#292524_0%,#431407_55%,#1c1917_100%)] px-6 py-6 text-white shadow-[0_24px_70px_-30px_rgba(67,20,7,0.65)] sm:px-8 sm:py-7 print:bg-white print:p-0 print:text-slate-950 print:shadow-none">
      <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl print:hidden" />
      <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-amber-400/10 blur-3xl print:hidden" />

      <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4 print:border-none">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-100 print:hidden">
          <Sparkles className="h-3.5 w-3.5" />
          {eyebrow}
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
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
            icon={<CalendarDays className="h-4 w-4 text-slate-400" />}
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
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 px-3.5 text-xs font-semibold uppercase tracking-wider text-white transition"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Xuất báo cáo</span>
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-950/30 transition active:scale-[0.98]"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">In PDF</span>
          </button>
        </div>
      </div>

      <div className="relative grid gap-5 pt-5 lg:grid-cols-[minmax(320px,0.9fr)_minmax(520px,1.1fr)] lg:items-center">
        <div className="text-left">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-300 print:text-slate-650">
            {description}
          </p>
        </div>

        {highlights.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {highlights.slice(0, 3).map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm text-left transition hover:border-orange-300/25 hover:bg-white/10"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-200/80">
                  {item.label}
                </p>
                <p className="mt-1.5 text-lg font-bold tracking-tight text-white sm:text-xl">
                  {item.value}
                </p>
                <p className="mt-1 truncate text-[10px] text-slate-350">
                  {item.helper}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {period === "custom" && (
        <div className="relative mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4 print:hidden">
          <span className="mr-1 text-xs font-medium text-slate-300">Khoảng báo cáo</span>
          <DateInput value={dateFrom} onChange={onDateFromChange} />
          <span className="text-slate-400">→</span>
          <DateInput value={dateTo} onChange={onDateToChange} />
        </div>
      )}
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
          className="flex h-10 min-w-[142px] items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur transition hover:bg-white/15 data-[state=open]:border-orange-400/40"
        >
          {icon}
          <span className="truncate">{selected?.label}</span>
          <ChevronDown className="ml-auto h-4 w-4 text-orange-200 transition duration-200 [[data-state=open]_&]:rotate-180" />
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
      className="h-9 rounded-lg border border-white/10 bg-white/10 px-3 text-xs text-white outline-none [color-scheme:dark] focus:border-white/30"
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

