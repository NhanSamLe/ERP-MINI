import { formatVND } from "@/utils/currency.helper";
import { Info } from "lucide-react";

interface Props {
  amount: number;
  currencyId?: number; 
  exchangeRate?: number;
  className?: string;
  showTooltip?: boolean;
}

/**
 * Intelligent currency formatter that displays amounts and handles exchange rates
 * Standard is VND (or Base Currency). If a transaction is in Foreign Currency,
 * it will display the foreign amount format and optionally show a tooltip with the converted base amount.
 */
export function CurrencyFormatter({
  amount,
  currencyId,
  exchangeRate = 1,
  className = "font-medium text-gray-900",
  showTooltip = true,
}: Props) {
  
  // Note: Usually currency info should come from Redux or Context. 
  // For simplicity, we assume currencyId = 1 is Base (VND), others are foreign.
  // In a real scenario, you would look up the symbol based on currencyId.
  const isForeign = currencyId ? currencyId !== 1 : false;
  
  // Basic USD formatter for example purposes
  const formatUSD = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  const getFormat = (val: number) => {
    if (isForeign) {
      // Assuming currencyId != 1 is USD for now. Could be dynamic later.
      return formatUSD(val);
    }
    return formatVND(val);
  };

  const formattedAmount = getFormat(amount);
  
  // Calculate base amount if foreign
  const baseAmount = isForeign ? amount * exchangeRate : amount;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span>{formattedAmount}</span>
      
      {isForeign && showTooltip && (
        <div className="group relative flex items-center">
          <Info className="w-4 h-4 text-gray-400 hover:text-orange-500 transition-colors cursor-help" />
          
          {/* Custom Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
            <div className="flex flex-col gap-1">
              <span className="text-gray-300">Base Currency (VND)</span>
              <span className="font-semibold text-orange-300">{formatVND(baseAmount)}</span>
              <span className="text-gray-400 text-[10px]">
                Rate: 1 = {formatVND(exchangeRate).replace('₫', '').trim()} ₫
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
