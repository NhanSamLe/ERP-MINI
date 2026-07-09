import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FormInputProps {
  label?: string;
  type?: string;
  value: string | number;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  error?: string;
  hint?: string;
  className?: string;
  textarea?: boolean;
  rows?: number;
  maxLength?: number;
}

const baseInput = [
  "w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100",
  "placeholder:text-gray-400 dark:placeholder:text-slate-500",
  "transition-colors duration-150",
  "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
  "disabled:bg-gray-50 dark:disabled:bg-slate-800 disabled:text-gray-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed",
  "read-only:bg-gray-50 dark:read-only:bg-slate-800 read-only:text-gray-600 dark:read-only:text-slate-300",
].join(" ");

export function FormInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  disabled,
  readOnly,
  icon,
  iconPosition = "right",
  error,
  hint,
  className,
  textarea,
  rows = 4,
  maxLength,
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === "password";
  const currentType = isPasswordType && showPassword ? "text" : type;

  const hasLeftIcon  = icon && iconPosition === "left";
  const hasRightIcon = (icon && iconPosition === "right") || isPasswordType;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {hasLeftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </span>
        )}

        {textarea ? (
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            rows={rows}
            className={[
              baseInput,
              "px-3 py-2 resize-y min-h-[2.5rem]",
              error ? "border-red-400 focus:ring-red-400 focus:border-red-400" : "",
              className ?? "",
            ].join(" ")}
          />
        ) : (
          <input
            type={currentType}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            maxLength={maxLength}
            className={[
              baseInput,
              "h-9 px-3",
              hasLeftIcon  ? "pl-9" : "",
              hasRightIcon ? "pr-9" : "",
              error ? "border-red-400 focus:ring-red-400 focus:border-red-400" : "",
              className ?? "",
            ].join(" ")}
          />
        )}

        {hasRightIcon && !textarea && (
          isPasswordType ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 focus:outline-none"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          ) : (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </span>
          )
        )}
      </div>

      {error && <p className="text-xs text-red-600 flex items-center gap-1">{error}</p>}
      {!error && hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
