import { ReactNode } from "react";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumb?: Breadcrumb[];
  count?: number;
}

export default function PageHeader({ title, description, action, count }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-4 border-b border-gray-200 bg-white">
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 break-words">{title}</h1>
          {count !== undefined && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">
              {count}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5 break-words">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
