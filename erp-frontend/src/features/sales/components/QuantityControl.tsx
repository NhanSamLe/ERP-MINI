import { memo } from 'react';
import { Plus, Minus } from 'lucide-react';

interface QuantityControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
}

const QuantityControl = memo(function QuantityControl({ 
  value, 
  onChange, 
  min = 1 
}: QuantityControlProps) {
  const handleDecrease = (): void => {
    const newValue = Math.max(min, value - 1);
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleIncrease = (): void => {
    onChange(value + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = parseInt(e.target.value) || min;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex items-center border border-gray-300 rounded-lg bg-white">
      <button
        type="button"
        onClick={handleDecrease}
        className="p-1.5 hover:bg-orange-50 transition"
      >
        <Minus size={16} className="text-orange-600" />
      </button>
      <input
        type="number"
        min={min}
        value={value}
        onChange={handleInputChange}
        className="w-14 text-center border-0 bg-transparent font-medium text-sm"
      />
      <button
        type="button"
        onClick={handleIncrease}
        className="p-1.5 hover:bg-orange-50 transition"
      >
        <Plus size={16} className="text-orange-600" />
      </button>
    </div>
  );
});

export default QuantityControl;