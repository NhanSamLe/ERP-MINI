import React, { useState, createContext, useContext, forwardRef } from "react";
import { ChevronDown, Check } from "lucide-react";

type SelectContextType = {
  value?: string;
  onValueChange: (value: string) => void;
  selectedLabel: string;
  setSelectedLabel: (label: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SelectContext = createContext<SelectContextType | undefined>(undefined);

const useSelect = () => {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error("Select components must be used within Select");
  return ctx;
};

type SelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
};

export const Select = ({
  value,
  onValueChange,
  children,
  defaultLabel = "",
}: SelectProps & { defaultLabel?: string }) => {
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(defaultLabel);

  React.useEffect(() => {
    setSelectedLabel(defaultLabel);
  }, [defaultLabel]);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: onValueChange || (() => {}),
        selectedLabel,
        setSelectedLabel,
        open,
        setOpen,
      }}
    >
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className = "", children }, ref) => {
  const { value, selectedLabel, open, setOpen } = useSelect();
  const hasValue = value && value !== "";

  return (
    <div
      ref={ref}
      onClick={() => setOpen(!open)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm cursor-pointer transition-all select-none ${className}`}
    >
      <span className={!hasValue ? "text-gray-400" : ""}>
        {hasValue ? selectedLabel : children}
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
  const { value, selectedLabel } = useSelect();

  if (!value) return <span className="text-gray-400">{placeholder}</span>;

  return <>{selectedLabel}</>;
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
      className={`absolute left-0 right-0 top-full mt-1 z-50 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="max-h-60 overflow-auto py-1">{children}</div>
    </div>
  );
};

export const SelectItem = forwardRef<
  HTMLDivElement,
  { value: string; children: string; className?: string }
>(({ value, children, className = "" }, ref) => {
  const {
    value: selectedValue,
    onValueChange,
    setSelectedLabel,
    setOpen,
  } = useSelect();

  const selected = selectedValue === value;

  const handleClick = () => {
    onValueChange(value);
    setSelectedLabel(children); // ⭐ Lưu label vào context
    setOpen(false);
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={`relative flex cursor-pointer select-none items-center px-3 py-2 text-sm transition-colors hover:bg-orange-100 hover:text-orange-900 ${
        selected ? "bg-orange-50 text-orange-900 font-medium" : ""
      } ${className}`}
    >
      <Check
        className={`mr-2 h-4 w-4 text-orange-600 ${
          selected ? "visible" : "invisible"
        }`}
      />
      <span>{children}</span>
    </div>
  );
});
SelectItem.displayName = "SelectItem";
