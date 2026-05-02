import { Loader2 } from "lucide-react";

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
  secondary: "bg-gray-700 hover:bg-gray-800 active:bg-gray-900 text-white shadow-sm",
  outline:   "border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700",
  ghost:     "text-orange-600 hover:bg-orange-50 active:bg-orange-100",
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
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center font-medium",
        "transition-all duration-150 select-none",
        "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{loading ? "Processing..." : children}</span>
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
