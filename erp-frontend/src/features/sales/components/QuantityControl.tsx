import { memo } from "react";
import { Plus, Minus } from "lucide-react";

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const QuantityControl = memo(function QuantityControl({ value, onChange, min = 1, max }: Props) {
  const numVal = typeof value === "number" ? value : (parseFloat(value as any) || 0);

  const dec = () => { if (numVal > min) onChange(numVal - 1); };
  const inc = () => { if (!max || numVal < max) onChange(numVal + 1); };
  const set = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value) || min;
    onChange(Math.max(min, max ? Math.min(v, max) : v));
  };

  return (
    <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden bg-white h-8">
      <button
        type="button"
        onClick={dec}
        disabled={numVal <= min}
        className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed border-r border-gray-200 transition-colors"
      >
        <Minus className="w-3 h-3" />
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={Number.isInteger(numVal) ? numVal : parseFloat(numVal.toFixed(3))}
        onChange={set}
        className="w-12 h-full text-center text-sm font-semibold text-gray-800 bg-white focus:outline-none focus:bg-orange-50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={inc}
        disabled={!!max && numVal >= max}
        className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed border-l border-gray-200 transition-colors"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
});

export default QuantityControl;
