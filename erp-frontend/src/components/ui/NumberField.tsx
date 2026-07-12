import { useEffect, useState } from "react";
import { formatNumberInput, parseNumberInput } from "@/utils/currency.helper";

interface NumberFieldProps {
  /** Giá trị number thuần (không format). null/undefined = rỗng. */
  value: number | null | undefined;
  /** Trả về number thuần đã clamp theo min/max (hoặc null nếu rỗng). */
  onChange: (value: number | null) => void;
  /**
   * 'thousand' (mặc định): hiển thị phân tách nghìn kiểu VN (1.000.000) — cho tiền/số lượng.
   * 'percent': như thousand nhưng mặc định min=0, max=100, hiển thị hậu tố %.
   */
  variant?: "thousand" | "percent";
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  /** Số chữ số thập phân tối đa giữ lại khi blur. Mặc định: 2 (percent), 4 (thousand). */
  maxDecimals?: number;
}

/**
 * Ô nhập số dùng chung cho TIỀN / SỐ LƯỢNG / PHẦN TRĂM.
 * - Hiển thị phân tách nghìn kiểu VN (1.000.000) trong khi gõ.
 * - Chặn min/max (mặc định percent: 0–100), kẹp giá trị khi blur.
 * - KHÔNG dùng cho số điện thoại (số điện thoại để type="tel", không format nghìn).
 */
export function NumberField({
  value,
  onChange,
  variant = "thousand",
  min,
  max,
  placeholder,
  disabled,
  readOnly,
  className,
  maxDecimals,
}: NumberFieldProps) {
  const isPercent = variant === "percent";
  const effMin = min ?? (isPercent ? 0 : undefined);
  const effMax = max ?? (isPercent ? 100 : undefined);
  const effDecimals = maxDecimals ?? (isPercent ? 2 : 4);

  // Chuỗi hiển thị (đã format). Đồng bộ với value từ ngoài khi không đang gõ dở.
  const [display, setDisplay] = useState<string>(
    value == null ? "" : formatNumberInput(value),
  );

  useEffect(() => {
    const current = parseNumberInput(display);
    if ((value ?? null) !== (current ?? null)) {
      setDisplay(value == null ? "" : formatNumberInput(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const clamp = (n: number): number => {
    let v = n;
    if (effMin !== undefined && v < effMin) v = effMin;
    if (effMax !== undefined && v > effMax) v = effMax;
    return v;
  };

  const handleChange = (raw: string) => {
    const formatted = formatNumberInput(raw);
    setDisplay(formatted);
    const parsed = parseNumberInput(formatted);
    if (parsed == null) return onChange(null);
    // Trong lúc gõ chỉ chặn vượt max (để không cho nhập >100%), min xử lý khi blur.
    const capped = effMax !== undefined && parsed > effMax ? effMax : parsed;
    onChange(capped);
    if (capped !== parsed) setDisplay(formatNumberInput(capped));
  };

  const handleBlur = () => {
    const parsed = parseNumberInput(display);
    if (parsed == null) {
      setDisplay("");
      return;
    }
    const clamped = Number(clamp(parsed).toFixed(effDecimals));
    setDisplay(formatNumberInput(clamped));
    onChange(clamped);
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={[
          "w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white",
          "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
          "disabled:bg-gray-50 disabled:text-gray-500 read-only:bg-gray-50",
          isPercent ? "pr-7 text-left" : "text-left",
          className ?? "",
        ].join(" ")}
      />
      {isPercent && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
          %
        </span>
      )}
    </div>
  );
}
