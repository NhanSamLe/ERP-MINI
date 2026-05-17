import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional icon shown in the accent bar */
  icon?: ReactNode;
  actions?: ReactNode;
  /** Extra badge/tag shown next to the title (e.g. record count) */
  badge?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  badge,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left — title block */}
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight truncate">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right — actions */}
      {actions && (
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
