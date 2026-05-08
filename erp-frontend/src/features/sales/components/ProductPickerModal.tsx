import { useState, useMemo, useRef, useEffect } from "react";
import { X, Search, Package, Check, Tag, Layers } from "lucide-react";
import { Product } from "@/features/products/store/product.types";
import { formatVND } from "@/utils/currency.helper";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelect: (product: Product) => void;
  selectedProductIds?: number[];
}

export default function ProductPickerModal({
  isOpen, onClose, products, onSelect, selectedProductIds = [],
}: Props) {
  const [search, setSearch]           = useState("");
  const [typeFilter, setTypeFilter]   = useState<string>("");
  const searchRef                     = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setTypeFilter("");
      setTimeout(() => searchRef.current?.focus(), 60);
    }
  }, [isOpen]);

  const productTypes = useMemo(() => {
    const types = [...new Set(products.map((p) => p.product_type).filter(Boolean))];
    return types as string[];
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (typeFilter) list = list.filter((p) => p.product_type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.internal_ref ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, search, typeFilter]);

  const handleSelect = (p: Product) => {
    onSelect(p);
    onClose();
  };

  const typeLabel: Record<string, string> = {
    storable:    "Storable",
    consumable:  "Consumable",
    service:     "Service",
  };

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Dialog */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
           style={{ maxHeight: "85vh" }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Select Product</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""} available
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Search + Filters ── */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60 shrink-0 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU or internal ref..."
              className="w-full h-9 pl-9 pr-8 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-gray-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type filter chips */}
          {productTypes.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setTypeFilter("")}
                className={[
                  "inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium transition-colors",
                  typeFilter === ""
                    ? "bg-orange-500 text-white"
                    : "bg-white border border-gray-300 text-gray-600 hover:border-gray-400",
                ].join(" ")}
              >
                All
              </button>
              {productTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t === typeFilter ? "" : t)}
                  className={[
                    "inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-xs font-medium transition-colors",
                    typeFilter === t
                      ? "bg-orange-500 text-white"
                      : "bg-white border border-gray-300 text-gray-600 hover:border-gray-400",
                  ].join(" ")}
                >
                  <Layers className="w-3 h-3" />
                  {typeLabel[t] ?? t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product List ── */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
              <Package className="w-10 h-10" />
              <p className="text-sm font-medium">
                {search ? `No results for "${search}"` : "No products available"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((p) => {
                const isSelected = selectedProductIds.includes(p.id);
                const outOfStock = (p.min_stock_qty ?? 0) <= 0 && p.product_type === "storable";

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    disabled={isSelected}
                    className={[
                      "w-full text-left px-3 py-3 rounded-lg border transition-all duration-100",
                      isSelected
                        ? "bg-orange-50 border-orange-200 opacity-60 cursor-not-allowed"
                        : "bg-white border-gray-100 hover:border-orange-200 hover:bg-orange-50/40 cursor-pointer",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      <div className="w-11 h-11 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-gray-300" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          {/* Left: name + badges */}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate leading-snug">
                              {p.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-xs text-gray-400">SKU: {p.sku}</span>

                              {p.uom?.code && (
                                <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500">
                                  {p.uom.code}
                                </span>
                              )}

                              {p.product_type && (
                                <span className={[
                                  "inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold",
                                  p.product_type === "storable"
                                    ? "bg-blue-50 text-blue-600"
                                    : p.product_type === "service"
                                    ? "bg-purple-50 text-purple-600"
                                    : "bg-gray-100 text-gray-500",
                                ].join(" ")}>
                                  {typeLabel[p.product_type] ?? p.product_type}
                                </span>
                              )}

                              {p.taxRate && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-600">
                                  <Tag className="w-2.5 h-2.5" />
                                  VAT {p.taxRate.rate}%
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: price + stock */}
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-orange-600 leading-snug">
                              {formatVND(p.sale_price ?? 0)}
                            </p>
                            {p.product_type === "storable" && (
                              <p className={[
                                "text-[10px] font-medium mt-0.5",
                                outOfStock ? "text-red-500" : "text-gray-400",
                              ].join(" ")}>
                                Stock: {p.min_stock_qty ?? 0}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Check icon if already in order */}
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60 shrink-0">
          <p className="text-xs text-gray-400 text-center">
            Click a product to add it to the order line
          </p>
        </div>
      </div>
    </div>
  );
}
