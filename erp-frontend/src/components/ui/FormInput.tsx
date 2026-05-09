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
}

const baseInput = [
  "w-full rounded-md border border-gray-300 bg-white text-sm text-gray-900",
  "placeholder:text-gray-400",
  "transition-colors duration-150",
  "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
  "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
  "read-only:bg-gray-50 read-only:text-gray-600",
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
}: FormInputProps) {
  const hasLeftIcon  = icon && iconPosition === "left";
  const hasRightIcon = icon && iconPosition === "right";

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
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
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
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
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </span>
        )}
      </div>

      {error && <p className="text-xs text-red-600 flex items-center gap-1">{error}</p>}
      {!error && hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
