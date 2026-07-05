import { useEffect, useState } from "react";
import { stockLotApi, StockLot } from "../api/stockLot.api";
import { toast } from "react-toastify";

export interface NewLotData {
  lot_no: string;
  expiry_date?: string;
  manufacture_date?: string;
  serial_no?: string;
  supplier_id?: number | null;
  notes?: string;
}

interface LotSelectProps {
  productId: number | null | undefined;
  /** lot_id nếu chọn lot có sẵn */
  value: number | null | undefined;
  onChange: (lotId: number | null) => void;
  /** new_lot nếu tạo lot mới inline */
  newLot?: NewLotData | null;
  onNewLotChange?: (data: NewLotData | null) => void;
  /** Cho phép tạo lot mới inline */
  allowCreate?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** supplier_id mặc định khi tạo new lot (lấy từ PO) */
  defaultSupplierId?: number | null;
}

export function LotSelect({
  productId,
  value,
  onChange,
  newLot,
  onNewLotChange,
  allowCreate = false,
  placeholder = "— Không có lô —",
  disabled = false,
  className = "",
  defaultSupplierId,
}: LotSelectProps) {
  const [lots, setLots] = useState<StockLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("existing");

  useEffect(() => {
    if (!productId) {
      setLots([]);
      return;
    }
    setLoading(true);
    stockLotApi
      .getByProduct(productId)
      .then(setLots)
      .catch(() => setLots([]))
      .finally(() => setLoading(false));
  }, [productId]);

  // Reset khi đổi mode
  const handleModeChange = (newMode: "existing" | "new") => {
    setMode(newMode);
    if (newMode === "existing") {
      onNewLotChange?.(null);
    } else {
      onChange(null);
      // Tự động set supplier_id từ PO nếu có
      onNewLotChange?.({
        lot_no: "",
        supplier_id: defaultSupplierId ?? undefined,
      });
    }
  };

  const formatOption = (lot: StockLot) => {
    let label = lot.lot_no;
    if (lot.expiry_date) label += ` (hsd: ${lot.expiry_date})`;
    return label;
  };

  if (!allowCreate) {
    // Simple mode — chỉ chọn lot có sẵn
    return (
      <select
        value={value ?? ""}
        onChange={(e) => {
          const val = e.target.value ? Number(e.target.value) : null;
          if (val) {
            const selectedLot = lots.find((l) => l.id === val);
            if (selectedLot && selectedLot.expiry_date) {
              const today = new Date().toISOString().split("T")[0];
              if (selectedLot.expiry_date < today) {
                toast.error(`Không thể chọn lô ${selectedLot.lot_no} vì đã hết hạn sử dụng (${selectedLot.expiry_date})!`);
                return;
              }
            }
          }
          onChange(val);
        }}
        disabled={disabled || loading || !productId}
        className={`border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-orange-400 focus:outline-none w-full ${
          !productId ? "bg-gray-50 text-gray-400" : ""
        } ${className}`}
      >
        <option value="">{loading ? "Đang tải..." : placeholder}</option>
        {lots.map((l) => (
          <option key={l.id} value={l.id}>
            {formatOption(l)}
          </option>
        ))}
      </select>
    );
  }

  // Full mode — chọn có sẵn hoặc tạo mới
  return (
    <div className="space-y-1">
      {/* Mode toggle */}
      <div className="flex gap-1 text-xs">
        <button
          type="button"
          onClick={() => handleModeChange("existing")}
          className={`px-2 py-0.5 rounded border transition ${
            mode === "existing"
              ? "bg-orange-500 text-white border-orange-500"
              : "bg-white text-gray-600 border-gray-300 hover:border-orange-400"
          }`}
        >
          Chọn lô có sẵn
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("new")}
          className={`px-2 py-0.5 rounded border transition ${
            mode === "new"
              ? "bg-orange-500 text-white border-orange-500"
              : "bg-white text-gray-600 border-gray-300 hover:border-orange-400"
          }`}
        >
          + Thêm lô mới
        </button>
      </div>

      {mode === "existing" ? (
        <select
          value={value ?? ""}
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : null;
            if (val) {
              const selectedLot = lots.find((l) => l.id === val);
              if (selectedLot && selectedLot.expiry_date) {
                const today = new Date().toISOString().split("T")[0];
                if (selectedLot.expiry_date < today) {
                  toast.error(`Không thể chọn lô ${selectedLot.lot_no} vì đã hết hạn sử dụng (${selectedLot.expiry_date})!`);
                  return;
                }
              }
            }
            onChange(val);
          }}
          disabled={disabled || loading || !productId}
          className={`border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-orange-400 focus:outline-none w-full ${
            !productId ? "bg-gray-50 text-gray-400" : ""
          } ${className}`}
        >
          <option value="">{loading ? "Đang tải..." : placeholder}</option>
          {lots.map((l) => (
            <option key={l.id} value={l.id}>
              {formatOption(l)}
            </option>
          ))}
        </select>
      ) : (
        <div className="space-y-1">
          <input
            type="text"
            placeholder="Mã lô *"
            value={newLot?.lot_no ?? ""}
            onChange={(e) =>
              onNewLotChange?.({ ...newLot, lot_no: e.target.value })
            }
            className="w-full border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-orange-400 focus:outline-none font-mono"
          />
          <input
            type="text"
            placeholder="Số Serial"
            value={newLot?.serial_no ?? ""}
            onChange={(e) =>
              onNewLotChange?.({
                ...newLot,
                lot_no: newLot?.lot_no ?? "",
                serial_no: e.target.value || undefined,
              })
            }
            className="w-full border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-orange-400 focus:outline-none"
          />
          <input
            type="date"
            placeholder="Ngày sản xuất"
            value={newLot?.manufacture_date ?? ""}
            onChange={(e) =>
              onNewLotChange?.({
                ...newLot,
                lot_no: newLot?.lot_no ?? "",
                manufacture_date: e.target.value || undefined,
              })
            }
            className="w-full border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-orange-400 focus:outline-none"
          />
          <input
            type="date"
            placeholder="Hạn sử dụng"
            value={newLot?.expiry_date ?? ""}
            onChange={(e) =>
              onNewLotChange?.({
                ...newLot,
                lot_no: newLot?.lot_no ?? "",
                expiry_date: e.target.value || undefined,
              })
            }
            className="w-full border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-orange-400 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Ghi chú"
            value={newLot?.notes ?? ""}
            onChange={(e) =>
              onNewLotChange?.({
                ...newLot,
                lot_no: newLot?.lot_no ?? "",
                notes: e.target.value || undefined,
              })
            }
            className="w-full border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-orange-400 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
