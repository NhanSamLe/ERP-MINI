import { formatVND } from "@/utils/currency.helper";
import { Info } from "lucide-react";

interface Props {
  amount: number;
  /** Mã ISO của tiền tệ giao dịch (vd "VND", "USD", "EUR"). Ưu tiên dùng. */
  currencyCode?: string;
  /** Ký hiệu tiền tệ nếu muốn hiển thị tùy biến (vd "$", "€"). Tùy chọn. */
  currencySymbol?: string;
  /** @deprecated Giữ tương thích ngược — nên truyền currencyCode thay vì id. */
  currencyId?: number;
  exchangeRate?: number;
  className?: string;
  showTooltip?: boolean;
}

/** Mã tiền tệ gốc của hệ thống. ERP-MINI phục vụ doanh nghiệp VN nên base luôn là VND. */
const BASE_CURRENCY_CODE = "VND";

/**
 * Hiển thị số tiền theo đúng tiền tệ giao dịch.
 * Base luôn là VND. Nếu giao dịch bằng ngoại tệ, hiển thị theo định dạng ngoại tệ
 * và (tùy chọn) tooltip quy đổi về VND theo tỉ giá.
 */
export function CurrencyFormatter({
  amount,
  currencyCode,
  currencySymbol,
  currencyId,
  exchangeRate = 1,
  className = "font-medium text-gray-900",
  showTooltip = true,
}: Props) {
  // Xác định base theo MÃ tiền tệ (bền hơn so với hardcode id = 1).
  // Tương thích ngược: nếu chỉ có currencyId thì coi id === 1 là base (VND).
  const code = currencyCode?.toUpperCase();
  const isForeign = code
    ? code !== BASE_CURRENCY_CODE
    : currencyId
      ? currencyId !== 1
      : false;

  const formatForeign = (val: number) => {
    // Format theo mã ISO nếu có (đúng ký hiệu cho mọi loại tiền), nếu không thì
    // fallback dùng symbol truyền vào, cuối cùng mới hiển thị số thuần + code.
    if (code) {
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: code,
        }).format(val);
      } catch {
        /* mã không hợp lệ với Intl → fallback bên dưới */
      }
    }
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
    return currencySymbol ? `${currencySymbol}${formatted}` : `${formatted} ${code ?? ""}`.trim();
  };

  const formattedAmount = isForeign ? formatForeign(amount) : formatVND(amount);

  // Quy đổi về VND nếu là ngoại tệ
  const baseAmount = isForeign ? amount * exchangeRate : amount;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span>{formattedAmount}</span>

      {isForeign && showTooltip && (
        <div className="group relative flex items-center">
          <Info className="w-4 h-4 text-gray-400 hover:text-orange-500 transition-colors cursor-help" />

          {/* Tooltip quy đổi VND */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
            <div className="flex flex-col gap-1">
              <span className="text-gray-300">Quy đổi (VND)</span>
              <span className="font-semibold text-orange-300">{formatVND(baseAmount)}</span>
              <span className="text-gray-400 text-[10px]">
                Tỉ giá: 1 {code ?? ""} = {formatVND(exchangeRate).replace("₫", "").trim()} ₫
              </span>
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}
