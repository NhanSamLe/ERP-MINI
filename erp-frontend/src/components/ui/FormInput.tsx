interface FormInputProps {
  label: string;
  type?: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  readOnly?: boolean;
  error?: string;
  className?: string;
}

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
  error,
  className
}: FormInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={`w-full px-4 py-3 ${icon ? 'pr-10' : ''} border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none ${
            disabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''
          } ${error ? 'border-red-500' : 'border-gray-300'}
          ${className ?? ''}`}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
        />
        {icon && (
          <div className="absolute right-3 top-3.5">
            {icon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}