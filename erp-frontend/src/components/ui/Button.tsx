import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { subscribeToActiveRequests } from "../../api/axiosClient";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "warning";
type Size = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:   "bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-sm hover:shadow-orange",
  secondary: "bg-gray-700 dark:bg-slate-700 hover:bg-gray-800 dark:hover:bg-slate-600 active:bg-gray-900 text-white shadow-sm",
  outline:   "border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 active:bg-gray-100 dark:active:bg-slate-700 text-gray-700 dark:text-slate-200",
  ghost:     "text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 active:bg-orange-100 dark:active:bg-orange-500/20",
  danger:    "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm",
  success:   "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm",
  warning:   "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-sm",
};

const sizeStyles: Record<Size, string> = {
  xs: "h-6 px-2 text-xs gap-1 rounded",
  sm: "h-7 px-3 text-sm gap-1.5 rounded-md",
  md: "h-9 px-4 text-sm gap-2 rounded-md",
  lg: "h-11 px-6 text-base gap-2 rounded-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = "",
  onClick,
  ...props
}: ButtonProps) {
  const [isClicked, setIsClicked] = useState(false);
  const [networkLoading, setNetworkLoading] = useState(false);

  useEffect(() => {
    if (!isClicked) return;

    let hasStartedRequest = false;

    const unsubscribe = subscribeToActiveRequests((count) => {
      if (count > 0) {
        hasStartedRequest = true;
        setNetworkLoading(true);
      } else {
        if (hasStartedRequest) {
          setNetworkLoading(false);
          setIsClicked(false);
        }
      }
    });

    // Fallback timers:
    // 1. If no network request starts within 300ms, reset clicked state (likely a local client-side action/validation error)
    // 2. Safe timeout of 8 seconds to prevent getting stuck in loading state
    const timeout = setTimeout(() => {
      if (!hasStartedRequest) {
        setIsClicked(false);
      }
    }, 300);

    const maxTimeout = setTimeout(() => {
      setIsClicked(false);
      setNetworkLoading(false);
    }, 8000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
      clearTimeout(maxTimeout);
    };
  }, [isClicked]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsClicked(true);
    if (onClick) {
      onClick(e);
    }
  };

  const showLoading = loading || networkLoading;

  return (
    <button
      className={[
        "inline-flex min-w-0 items-center justify-center font-medium whitespace-nowrap",
        "transition-all duration-150 select-none",
        "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      disabled={disabled || showLoading}
      onClick={handleClick}
      {...props}
    >
      {showLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0 mr-2" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span className="min-w-0 whitespace-nowrap text-center leading-tight flex items-center justify-center gap-1.5">
        {children}
      </span>
      {!showLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
