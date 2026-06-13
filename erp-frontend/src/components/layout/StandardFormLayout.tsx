import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

type ActionVariant = "primary" | "secondary" | "danger" | "success" | "outline";

interface Action {
  label: string;
  variant?: ActionVariant;
  onClick: () => void;
  isLoading?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
}

interface Props {
  title: string;
  actions?: Action[];
  children: ReactNode;
  sidebarContent?: ReactNode;
  statusBadge?: ReactNode;
  loading?: boolean;
}

const actionStyles: Record<ActionVariant, string> = {
  primary: "bg-orange-500 hover:bg-orange-600 text-white shadow-sm",
  success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
  danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
  secondary: "bg-gray-700 hover:bg-gray-800 text-white shadow-sm",
  outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
};

export function StandardFormLayout({
  title,
  actions = [],
  children,
  sidebarContent,
  statusBadge,
  loading = false,
}: Props) {
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* Sticky page header bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm border-t-2 border-t-orange-500">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 min-h-14 py-2 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {/* Left: title */}
          <div className="min-w-0 flex flex-wrap items-center gap-2">
            <h1 className="text-base font-semibold text-gray-900 break-words">
              {title}
            </h1>
            {statusBadge}
          </div>

          {/* Right: action buttons */}
          {actions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  disabled={action.isLoading || action.disabled}
                  className={[
                    "inline-flex min-w-0 items-center justify-center gap-1.5 min-h-8 px-3 sm:px-4 rounded-md text-sm font-medium",
                    "transition-colors duration-150 select-none",
                    "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    actionStyles[action.variant ?? "outline"],
                  ].join(" ")}
                >
                  {action.isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    action.icon && (
                      <span className="w-3.5 h-3.5">{action.icon}</span>
                    )
                  )}
                  <span className="whitespace-normal text-center leading-tight">
                    {action.isLoading ? "Processing..." : action.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
        <div
          className={`grid gap-5 items-start ${sidebarContent ? "grid-cols-1 lg:grid-cols-[1fr_280px]" : "grid-cols-1"}`}
        >
          {/* Main column */}
          <main className="min-w-0 space-y-4">{children}</main>

          {/* Sidebar */}
          {sidebarContent && (
            <aside className="space-y-4 lg:sticky lg:top-[3.5rem]">
              {sidebarContent}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
