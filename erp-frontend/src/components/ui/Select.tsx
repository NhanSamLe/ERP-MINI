import React, { useState, createContext, useContext, forwardRef } from "react";
import { ChevronDown, Check } from "lucide-react";

type SelectContextType = {
  value: string | undefined;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SelectContext = createContext<SelectContextType | undefined>(undefined);

const useSelect = () => {
  const context = useContext(SelectContext);
  if (!context) throw new Error("Select components must be used within Select");
  return context;
};

// Root Select
type SelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
};

export const Select = ({ value, onValueChange, children }: SelectProps) => {
  const [open, setOpen] = useState(false);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: onValueChange || (() => {}),
        open,
        setOpen,
      }}
    >
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
};

// SelectTrigger
export const SelectTrigger = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className = "", children }, ref) => {
  const { value, open, setOpen } = useSelect();
  const hasValue = value && value !== "";

  return (
    <div
      ref={ref}
      onClick={() => setOpen(!open)}
      className={`
          flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
          ring-offset-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
          cursor-pointer transition-all select-none
          ${open ? "ring-2 ring-orange-500 ring-offset-2" : ""}
          ${className}
        `}
    >
      <span className={!hasValue ? "text-gray-400" : ""}>
        {children || (hasValue ? value : "Select")}
      </span>
      <ChevronDown
        className={`h-4 w-4 opacity-50 transition-transform ${
          open ? "rotate-180" : ""
        }`}
      />
    </div>
  );
});
SelectTrigger.displayName = "SelectTrigger";

export const SelectValue = ({
  placeholder = "Select",
}: {
  placeholder?: string;
}) => {
  const { value } = useSelect();
  return <>{value || <span className="text-gray-400">{placeholder}</span>}</>;
};

export const SelectContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { open } = useSelect();

  if (!open) return null;

  return (
    <div
      className={`
        absolute left-0 right-0 top-full mt-1 z-50
        rounded-md border border-gray-200 bg-white shadow-lg
        overflow-hidden animate-in fade-in-0 zoom-in-95
        ${className}
      `}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="max-h-60 overflow-auto py-1">{children}</div>
    </div>
  );
};

// SelectItem
export const SelectItem = forwardRef<
  HTMLDivElement,
  { value: string; children: React.ReactNode; className?: string }
>(({ value, children, className = "" }, ref) => {
  const { value: selectedValue, onValueChange, setOpen } = useSelect();
  const selected = selectedValue === value;

  const handleClick = () => {
    onValueChange(value);
    setOpen(false);
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={`
        relative flex cursor-pointer select-none items-center px-3 py-2 text-sm outline-none
        transition-colors hover:bg-orange-100 hover:text-orange-900
        ${selected ? "bg-orange-50 text-orange-900 font-medium" : ""}
        ${className}
      `}
    >
      {selected && <Check className="mr-2 h-4 w-4 text-orange-600" />}
      <span className={selected ? "ml-6" : ""}>{children}</span>
    </div>
  );
});
SelectItem.displayName = "SelectItem";
