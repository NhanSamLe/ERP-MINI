import { useState, useEffect } from "react";

interface PriceInputProps {
  label: string;
  value: number | undefined;
  onChange: (val: number) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  currency?: string;
}

/** Format number -> "1.000.000" (VN style, dấu chấm phân cách nghìn) */
function formatDisplay(num: number | undefined): string {
  if (num === undefined || num === null) return "";
  if (num === 0) return "0";
  return Math.round(num).toLocaleString("vi-VN");
}

/** Strip mọi ký tự không phải số */
function parseRaw(str: string): number {
  const cleaned = str.replace(/[^\d]/g, "");
  return cleaned === "" ? 0 : parseInt(cleaned, 10);
}

export function PriceInput({
  label,
  value,
  onChange,
  error,
  placeholder = "0",
  disabled = false,
  currency = "VND",
}: PriceInputProps) {
  const [displayValue, setDisplayValue] = useState(formatDisplay(value));
  const [focused, setFocused] = useState(false);

  // Sync khi value thay đổi từ bên ngoài (load data)
  useEffect(() => {
    if (!focused) {
      setDisplayValue(formatDisplay(value));
    }
  }, [value, focused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Cho phép nhập tự do khi đang focus
    const numericOnly = raw.replace(/[^\d]/g, "");
    const num = numericOnly === "" ? 0 : parseInt(numericOnly, 10);

    // Hiển thị có format ngay khi gõ
    setDisplayValue(numericOnly === "" ? "" : num.toLocaleString("vi-VN"));
    onChange(num);
  };

  const handleFocus = () => {
    setFocused(true);
    // Khi focus: hiện số thuần không có dấu để dễ sửa
    setDisplayValue(
      value != null && value > 0 ? String(Math.round(value)) : "",
    );
  };

  const handleBlur = () => {
    setFocused(false);
    setDisplayValue(formatDisplay(value));
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full border rounded-lg pl-4 pr-14 py-3 text-sm focus:ring-2 focus:outline-none transition
            ${error ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-orange-400"}
            ${disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}
          `}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">
          {currency}
        </span>
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}
