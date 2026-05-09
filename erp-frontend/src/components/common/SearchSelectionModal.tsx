import { useState, useMemo } from "react";
import { Search, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SearchSelectionModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  items: T[];
  onSelect: (item: T) => void;
  renderItem: (item: T, isSelected?: boolean) => React.ReactNode;
  searchKeys: (keyof T)[];
  selectedItem?: T;
  isSelected?: (item: T) => boolean;
}

export function SearchSelectionModal<T>({
  isOpen,
  onClose,
  title,
  description,
  items,
  onSelect,
  renderItem,
  searchKeys,
  isSelected,
}: SearchSelectionModalProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter((item) =>
      searchKeys.some((key) => String(item[key]).toLowerCase().includes(lower))
    );
  }, [items, searchTerm, searchKeys]);

  const handleSelect = (item: T) => {
    onSelect(item);
    onClose();
    setSearchTerm("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl flex flex-col p-0 gap-0 overflow-hidden rounded-xl shadow-xl border border-gray-200">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div>
            <DialogTitle className="text-sm font-semibold text-gray-900">{title}</DialogTitle>
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              placeholder="Search..."
              className="w-full h-9 pl-9 pr-8 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Results */}
        <div className="flex-1 overflow-y-auto max-h-[60vh] px-3 py-3 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2 text-gray-400">
              <Search className="w-8 h-8" />
              <p className="text-sm">
                {searchTerm ? `No results for "${searchTerm}"` : "No items available"}
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const active = isSelected ? isSelected(item) : false;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={[
                    "w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-100",
                    active
                      ? "bg-orange-50 border-orange-200"
                      : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">{renderItem(item, active)}</div>
                    {active && <Check className="w-4 h-4 text-orange-500 shrink-0" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
