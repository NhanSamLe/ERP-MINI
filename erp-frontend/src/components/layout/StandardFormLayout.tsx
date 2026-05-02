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
  description?: string;
  actions?: Action[];
  children: ReactNode;
  sidebarContent?: ReactNode;
  statusBadge?: ReactNode;
  loading?: boolean;
  breadcrumb?: { label: string; onClick?: () => void }[];
}

const actionStyles: Record<ActionVariant, string> = {
  primary:   "bg-orange-500 hover:bg-orange-600 text-white shadow-sm",
  success:   "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
  danger:    "bg-red-600 hover:bg-red-700 text-white shadow-sm",
  secondary: "bg-gray-700 hover:bg-gray-800 text-white shadow-sm",
  outline:   "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
};

export function StandardFormLayout({
  title,
  description,
  actions = [],
  children,
  sidebarContent,
  statusBadge,
  loading = false,
  breadcrumb,
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
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: breadcrumb + title */}
          <div className="min-w-0">
            {breadcrumb && breadcrumb.length > 0 && (
              <nav className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                {breadcrumb.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span>/</span>}
                    {crumb.onClick ? (
                      <button
                        onClick={crumb.onClick}
                        className="hover:text-orange-500 transition-colors"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="text-gray-600">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-base font-semibold text-gray-900 truncate">{title}</h1>
              {statusBadge}
            </div>
            {description && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{description}</p>
            )}
          </div>

          {/* Right: action buttons */}
          {actions.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  disabled={action.isLoading || action.disabled}
                  className={[
                    "inline-flex items-center gap-1.5 h-8 px-4 rounded-md text-sm font-medium",
                    "transition-colors duration-150 select-none",
                    "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    actionStyles[action.variant ?? "outline"],
                  ].join(" ")}
                >
                  {action.isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    action.icon && <span className="w-3.5 h-3.5">{action.icon}</span>
                  )}
                  {action.isLoading ? "Processing..." : action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-screen-2xl mx-auto px-6 py-5">
        <div className={`grid gap-5 items-start ${sidebarContent ? "grid-cols-1 lg:grid-cols-[1fr_280px]" : "grid-cols-1"}`}>
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
