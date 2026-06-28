import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Printer,
  Sparkles,
  Filter,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempBranchId, setTempBranchId] = useState(branchId);
  const [tempPeriod, setTempPeriod] = useState<DashboardPeriod>(period);
  const [tempDateFrom, setTempDateFrom] = useState(dateFrom);
  const [tempDateTo, setTempDateTo] = useState(dateTo);
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
          
          {/* Unified Filter Dropdown */}
          <div className="relative inline-block text-left print:hidden">
            <button
              type="button"
              onClick={() => {
                setTempBranchId(branchId);
                setTempPeriod(period);
                setTempDateFrom(dateFrom);
                setTempDateTo(dateTo);
                setIsFilterOpen(!isFilterOpen);
              }}
              className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold uppercase tracking-wider shadow-sm transition ${
                isFilterOpen
                  ? "border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200"
              }`}
            >
              <Filter className="h-4 w-4 text-orange-500" />
              <span>Bộ lọc báo cáo</span>
              {(branchId !== "" || period !== "last_30_days") && (
                <span className="flex h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              )}
            </button>

            {isFilterOpen && (
              <>
                {/* Overlay to handle click outside */}
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsFilterOpen(false)} />
                
                {/* Popover Content */}
                <div className="absolute right-0 mt-2 z-50 w-80 origin-top-right rounded-2xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-2xl ring-1 ring-black/5 focus:outline-none animate-in fade-in-50 slide-in-from-top-1 duration-150 text-left">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">Bộ lọc nâng cao</h3>
                      <button type="button" onClick={() => setIsFilterOpen(false)} className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 transition">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Branch Selection */}
                    {branches.length > 0 && onBranchChange && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Chi nhánh</label>
                        <select
                          value={tempBranchId}
                          onChange={(e) => setTempBranchId(e.target.value)}
                          className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-orange-500/50"
                        >
                          <option value="">Tất cả chi nhánh</option>
                          {branches.map((b) => (
                            <option key={b.id} value={String(b.id)}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Period Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Thời gian</label>
                      <select
                        value={tempPeriod}
                        onChange={(e) => setTempPeriod(e.target.value as DashboardPeriod)}
                        className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-orange-500/50"
                      >
                        <option value="today">Hôm nay</option>
                        <option value="last_7_days">7 ngày qua</option>
                        <option value="last_30_days">30 ngày qua</option>
                        <option value="ytd">Năm nay</option>
                        <option value="custom">Tùy chọn ngày</option>
                      </select>
                    </div>

                    {/* Date Inputs if Custom */}
                    {tempPeriod === "custom" && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Từ ngày</label>
                          <input
                            type="date"
                            value={tempDateFrom}
                            onChange={(e) => setTempDateFrom(e.target.value)}
                            className="w-full h-9 rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-750 dark:text-slate-200 outline-none focus:border-orange-500/50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Đến ngày</label>
                          <input
                            type="date"
                            value={tempDateTo}
                            onChange={(e) => setTempDateTo(e.target.value)}
                            className="w-full h-9 rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-750 dark:text-slate-200 outline-none focus:border-orange-500/50"
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-2">
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="h-9 px-4 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 dark:text-slate-400 transition"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onPeriodChange(tempPeriod);
                          if (onBranchChange) onBranchChange(tempBranchId);
                          onDateFromChange(tempDateFrom);
                          onDateToChange(tempDateTo);
                          setIsFilterOpen(false);
                        }}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 text-xs font-bold text-white shadow-md shadow-orange-500/10 transition active:scale-[0.98]"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Áp dụng
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

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

        {/* Current Active Filter Badge */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 px-4 py-2.5 rounded-2xl shadow-sm print:hidden shrink-0 self-start sm:self-center text-xs font-semibold text-slate-650 dark:text-slate-350 text-left">
          <CalendarDays className="h-4 w-4 text-orange-500 shrink-0" />
          <span className="text-slate-400 dark:text-slate-500 font-normal">Đang lọc theo:</span>
          <span className="text-slate-900 dark:text-white font-extrabold">
            {period === "today" ? "Hôm nay" :
             period === "last_7_days" ? "7 ngày qua" :
             period === "last_30_days" ? "30 ngày qua" :
             period === "ytd" ? "Năm nay" : "Tùy chọn ngày"}
          </span>
          {(dateFrom || dateTo) && (
            <span className="text-orange-600 dark:text-orange-400 font-bold ml-1">
              ({dateFrom ? new Date(dateFrom).toLocaleDateString("vi-VN") : "..."} - {dateTo ? new Date(dateTo).toLocaleDateString("vi-VN") : "..."})
            </span>
          )}
        </div>
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

