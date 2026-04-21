import { useEffect, useState } from "react";
import { getAllUoms } from "../../master-data/api/uom.api";

interface UomOption {
  id: number;
  code: string;
  name: string;
}

interface UomSelectProps {
  /** Danh sách UOM options — nếu không truyền thì fetch toàn bộ từ API */
  options?: UomOption[];
  /** uom_id đang được chọn */
  value: number | null | undefined;
  onChange: (uomId: number | null) => void;
  disabled?: boolean;
  className?: string;
}

// Cache toàn bộ UOM list để không fetch lại nhiều lần
let _cachedUoms: UomOption[] | null = null;
async function fetchAllUoms(): Promise<UomOption[]> {
  if (_cachedUoms) return _cachedUoms;
  const res = await getAllUoms();
  const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
  _cachedUoms = data;
  return data;
}

export function UomSelect({
  options: propOptions,
  value,
  onChange,
  disabled = false,
  className = "",
}: UomSelectProps) {
  const [options, setOptions] = useState<UomOption[]>(propOptions ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (propOptions !== undefined) {
      setOptions(propOptions);
      return;
    }
    // Fetch toàn bộ UOM nếu không có options prop
    setLoading(true);
    fetchAllUoms()
      .then(setOptions)
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [propOptions]);

  // Auto-select option đầu tiên nếu chưa có value
  useEffect(() => {
    if (!value && options.length > 0) {
      onChange(options[0].id);
    }
  }, [options]);

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      disabled={disabled || loading || options.length === 0}
      className={`border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-orange-400 focus:outline-none w-full ${
        options.length === 0 ? "bg-gray-50 text-gray-400" : ""
      } ${className}`}
    >
      {loading && <option value="">Loading...</option>}
      {!loading && options.length === 0 && <option value="">—</option>}
      {options.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name} ({u.code})
        </option>
      ))}
    </select>
  );
}

/** Helper: build UOM options từ product data (dùng khi muốn giới hạn chỉ uom + purchaseUom) */
export function buildUomOptions(product: {
  uom?: { id: number; code: string; name: string } | null;
  purchaseUom?: { id: number; code: string; name: string } | null;
}): UomOption[] {
  const opts: UomOption[] = [];
  if (product.uom) opts.push(product.uom);
  if (product.purchaseUom && product.purchaseUom.id !== product.uom?.id) {
    opts.push(product.purchaseUom);
  }
  return opts;
}
