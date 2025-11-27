import React from "react";

export interface TextareaProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  value = "",
  onChange,
  placeholder,
  rows = 3,
  className = "",
  disabled,
  readOnly,
}) => {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      className={`border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:outline-none w-full ${className}`}
    />
  );
};
