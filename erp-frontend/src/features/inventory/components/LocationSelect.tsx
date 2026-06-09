import { useEffect, useState } from "react";
import {
  stockLocationApi,
  StockLocation,
  StockLocationType,
} from "../api/stockLocation.api";

interface LocationSelectProps {
  warehouseId: number | null | undefined;
  value: number | null | undefined;
  onChange: (id: number | null) => void;
  types?: StockLocationType[]; // filter by type, default all active
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function LocationSelect({
  warehouseId,
  value,
  onChange,
  types,
  placeholder = "— Vị trí —",
  disabled = false,
  className = "",
}: LocationSelectProps) {
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!warehouseId) {
      setLocations([]);
      return;
    }
    setLoading(true);
    stockLocationApi
      .getAll(warehouseId)
      .then((data) => {
        let filtered = data.filter((l) => l.is_active);
        if (types && types.length > 0) {
          filtered = filtered.filter((l) => types.includes(l.type));
        }
        setLocations(filtered);
      })
      .catch(() => setLocations([]))
      .finally(() => setLoading(false));
  }, [warehouseId]);

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      disabled={disabled || loading || !warehouseId}
      className={`border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-orange-400 focus:outline-none w-full ${
        !warehouseId ? "bg-gray-50 text-gray-400" : ""
      } ${className}`}
    >
      <option value="">{loading ? "Đang tải..." : placeholder}</option>
      {locations.map((l) => (
        <option key={l.id} value={l.id}>
          {l.name} ({l.code})
        </option>
      ))}
    </select>
  );
}
