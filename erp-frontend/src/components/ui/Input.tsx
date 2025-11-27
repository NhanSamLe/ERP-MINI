import React from "react";

export interface InputProps {
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  max?: string | number;
}

export const Input: React.FC<InputProps> = ({
  type = "text",
  value = "",
  onChange,
  onFocus,
  placeholder,
  className = "",
  disabled,
  readOnly,
  max,
}) => {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onFocus={onFocus}
      disabled={disabled}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      max={max}
      className={`border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:outline-none w-full ${className}`}
    />
  );
};
