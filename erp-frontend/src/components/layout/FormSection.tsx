import { ReactNode } from "react";

interface Props {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  description?: string;
  noPadding?: boolean;
}

export function FormSection({
  title,
  icon,
  children,
  action,
  description,
  noPadding,
}: Props) {
  return (
    <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-orange-100 dark:border-orange-500/20 bg-gradient-to-r from-orange-50/40 to-white dark:from-orange-500/10 dark:to-slate-900">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && (
            <span className="w-7 h-7 flex items-center justify-center rounded-md bg-orange-50 text-orange-500 shrink-0">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-100 leading-none">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div className="ml-4 shrink-0">{action}</div>}
      </div>

      {/* Content */}
      <div className={noPadding ? "" : "px-5 py-4"}>{children}</div>
    </section>
  );
}
