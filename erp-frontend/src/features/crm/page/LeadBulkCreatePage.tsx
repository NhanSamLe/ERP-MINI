import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Search, CheckCircle, AlertCircle,
  Loader2, TableProperties, X, Copy,
} from "lucide-react";
import { toast } from "react-toastify";
import * as leadApi from "../api/lead.api";
import { getAllLeadSources } from "../api/lead.api";
import { formatNumberInput, parseNumberInput } from "@/utils/currency.helper";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeadSource { id: number; name: string; }

interface BulkRow {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  job_title: string;
  industry: string;
  company_size: string;
  annual_revenue: string;
  source_id: string;
}

type RowKey = keyof Omit<BulkRow, "_id">;
type RowErrors = Partial<Record<RowKey, string>>;
type AllErrors = Record<string, RowErrors>;

interface BulkResult {
  successCount: number;
  errorCount: number;
  errors: { index: number; name: string; message: string }[];
}

interface CellPos { row: number; col: number; }

// ─── Column definitions ───────────────────────────────────────────────────────


interface ColDef {
  key: RowKey;
  label: string;
  width: number;
  required?: boolean;
  type?: "text" | "number" | "select" | "select-source";
  options?: { label: string; value: string }[];
}

const COLUMNS: ColDef[] = [
  { key: "name",           label: "Tên Lead",           width: 180, required: true },
  { key: "email",          label: "Email",               width: 200 },
  { key: "phone",          label: "SĐT",                 width: 140 },
  { key: "company_name",   label: "Tên Công Ty",         width: 180 },
  { key: "job_title",      label: "Chức Vụ",             width: 140 },
  { key: "industry",       label: "Ngành Nghề",          width: 150 },
  { key: "company_size",   label: "Quy Mô",              width: 155 },
  { key: "annual_revenue", label: "Doanh Thu/Năm (VNĐ)", width: 175, type: "number" },
  { key: "source_id",      label: "Nguồn Lead",          width: 155, type: "select-source" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _rowId = 0;
const newRow = (): BulkRow => ({
  _id: `r${++_rowId}`,
  name: "", email: "", phone: "", company_name: "",
  job_title: "", industry: "", company_size: "", annual_revenue: "", source_id: "",
});

const isRowEmpty = (r: BulkRow) => COLUMNS.every((c) => r[c.key] === "");

function validateRows(rows: BulkRow[]): AllErrors {
  const errs: AllErrors = {};
  rows.forEach((row) => {
    if (isRowEmpty(row)) return;
    const rowErr: RowErrors = {};
    if (!row.name.trim()) rowErr.name = "Bắt buộc";
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email))
      rowErr.email = "Email không hợp lệ";
    if (row.phone && !/^0[3-9]\d{8}$/.test(row.phone.replace(/[\s\-]/g, "")))
      rowErr.phone = "SĐT không hợp lệ (VD: 0901234567)";
    if (row.annual_revenue && isNaN(Number(row.annual_revenue.replace(/,/g, ""))))
      rowErr.annual_revenue = "Phải là số";
    if (Object.keys(rowErr).length) errs[row._id] = rowErr;
  });
  return errs;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadBulkCreatePage() {
  const navigate = useNavigate();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [rows, setRows]           = useState<BulkRow[]>(() => Array.from({ length: 15 }, newRow));
  const [errors, setErrors]       = useState<AllErrors>({});
  const [sources, setSources]     = useState<LeadSource[]>([]);
  const [validated, setValidated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addCount, setAddCount]     = useState("10");
  const [result, setResult]       = useState<BulkResult | null>(null);

  // ── Selection state (anchor = fixed start, cursor = moving end) ─────────────
  const [selAnchor, setSelAnchor] = useState<CellPos | null>(null);
  const [selCursor, setSelCursor] = useState<CellPos | null>(null);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const cellRefs    = useRef<Map<string, HTMLInputElement | HTMLSelectElement>>(new Map());
  const skipSelReset = useRef(false); // prevent onFocus from resetting selection after programmatic focus
  const isDragging   = useRef(false); // true while mouse button held down and dragging across cells

  // ── End drag-select on mouse up anywhere in the document ────────────────────
  useEffect(() => {
    const onMouseUp = () => { isDragging.current = false; };
    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, []);

  // ── Load lead sources ───────────────────────────────────────────────────────
  useEffect(() => {
    getAllLeadSources()
      .then((res) => setSources((res.data?.data ?? []) as LeadSource[]))
      .catch(() => {});
  }, []);

  // ── Derived selection range (always normalized) ─────────────────────────────
  const selRange = useMemo(() => {
    if (!selAnchor || !selCursor) return null;
    return {
      startRow: Math.min(selAnchor.row, selCursor.row),
      endRow:   Math.max(selAnchor.row, selCursor.row),
      startCol: Math.min(selAnchor.col, selCursor.col),
      endCol:   Math.max(selAnchor.col, selCursor.col),
    };
  }, [selAnchor, selCursor]);

  const isCellSelected = (row: number, col: number) =>
    selRange != null &&
    row >= selRange.startRow && row <= selRange.endRow &&
    col >= selRange.startCol && col <= selRange.endCol;

  const isMultiSel = selRange != null &&
    (selRange.startRow !== selRange.endRow || selRange.startCol !== selRange.endCol);

  // ── Counts ──────────────────────────────────────────────────────────────────
  const filledRows  = rows.filter((r) => !isRowEmpty(r)).length;
  const errorCount  = Object.keys(errors).length;
  const canSubmit   = validated && errorCount === 0 && filledRows > 0;

  // ── Register / unregister cell ref ──────────────────────────────────────────
  const setCellRef = (id: string, key: RowKey) =>
    (el: HTMLInputElement | HTMLSelectElement | null) => {
      const k = `${id}-${key}`;
      if (el) cellRefs.current.set(k, el);
      else    cellRefs.current.delete(k);
    };

  // ── Focus a cell programmatically ───────────────────────────────────────────
  const focusCellByIdx = useCallback((row: number, col: number) => {
    const r = rows[row];
    const c = COLUMNS[col];
    if (!r || !c) return;
    const ref = cellRefs.current.get(`${r._id}-${c.key}`);
    if (ref) { skipSelReset.current = true; ref.focus(); }
  }, [rows]);

  // ── Update a single cell ─────────────────────────────────────────────────────
  const updateCell = useCallback((id: string, key: RowKey, value: string) => {
    setRows((prev) => prev.map((r) => (r._id === id ? { ...r, [key]: value } : r)));
    setErrors((prev) => {
      if (!prev[id]?.[key]) return prev;
      const next = { ...prev, [id]: { ...prev[id] } };
      delete next[id]![key];
      return next;
    });
    setValidated(false);
  }, []);

  // ── Paste (TSV from Excel) ───────────────────────────────────────────────────
  const handlePaste = useCallback(
    (rowIdx: number, colIdx: number) =>
      (e: React.ClipboardEvent<HTMLInputElement | HTMLSelectElement>) => {
        const text = e.clipboardData.getData("text");
        if (!text.includes("\t") && !text.includes("\n")) return;
        e.preventDefault();

        const pastedRows = text.trim().split(/\r?\n/);
        setRows((prev) => {
          const next = [...prev];
          pastedRows.forEach((rowText, ri) => {
            const tRow = rowIdx + ri;
            while (next.length <= tRow) next.push(newRow());
            rowText.split("\t").forEach((cell, ci) => {
              const tCol = colIdx + ci;
              if (tCol >= COLUMNS.length) return;
              const col = COLUMNS[tCol]!;
              let val = cell.trim();
              if (col.type === "select" && col.options) {
                const m = col.options.find(
                  (o) => o.value === val.toLowerCase() ||
                         o.label.toLowerCase().includes(val.toLowerCase())
                );
                if (m) val = m.value;
              } else if (col.type === "number") {
                val = parseNumberInput(val)?.toString() ?? "";
              }
              next[tRow] = { ...next[tRow]!, [col.key]: val };
            });
          });
          // Update selection to cover pasted area
          const lastRow = Math.min(rowIdx + pastedRows.length - 1, next.length - 1);
          const lastCols = pastedRows[0]?.split("\t").length ?? 1;
          const lastCol  = Math.min(colIdx + lastCols - 1, COLUMNS.length - 1);
          setSelAnchor({ row: rowIdx, col: colIdx });
          setSelCursor({ row: lastRow, col: lastCol });
          return next;
        });
        setValidated(false);
      },
    []
  );

  // ── Copy selection to clipboard ──────────────────────────────────────────────
  const copySelectionToClipboard = useCallback(() => {
    if (!selRange) return;
    const lines: string[] = [];
    for (let r = selRange.startRow; r <= selRange.endRow; r++) {
      const row = rows[r];
      if (!row) continue;
      const cells: string[] = [];
      for (let c = selRange.startCol; c <= selRange.endCol; c++) {
        cells.push(row[COLUMNS[c]!.key] ?? "");
      }
      lines.push(cells.join("\t"));
    }
    navigator.clipboard.writeText(lines.join("\n"))
      .then(() => toast.success("Đã sao chép vào clipboard"))
      .catch(() => toast.error("Không thể truy cập clipboard"));
  }, [selRange, rows]);

  // ── Fill down (Ctrl+D) ───────────────────────────────────────────────────────
  const fillDown = useCallback(() => {
    if (!selRange || selRange.startRow === selRange.endRow) return;
    const srcRow = rows[selRange.startRow];
    if (!srcRow) return;
    setRows((prev) =>
      prev.map((r, i) => {
        if (i <= selRange.startRow || i > selRange.endRow) return r;
        const updates: Partial<BulkRow> = {};
        for (let c = selRange.startCol; c <= selRange.endCol; c++) {
          updates[COLUMNS[c]!.key] = srcRow[COLUMNS[c]!.key];
        }
        return { ...r, ...updates };
      })
    );
    setValidated(false);
    toast.success(`Đã điền xuống ${selRange.endRow - selRange.startRow} dòng`);
  }, [selRange, rows]);

  // ── Clear selection cells ────────────────────────────────────────────────────
  const clearSelectionCells = useCallback(() => {
    if (!selRange) return;
    setRows((prev) =>
      prev.map((r, i) => {
        if (i < selRange.startRow || i > selRange.endRow) return r;
        const updates: Partial<BulkRow> = {};
        for (let c = selRange.startCol; c <= selRange.endCol; c++) {
          updates[COLUMNS[c]!.key] = "";
        }
        return { ...r, ...updates };
      })
    );
    setValidated(false);
  }, [selRange]);

  // ── Cell focus handler ───────────────────────────────────────────────────────
  const handleCellFocus = useCallback((rowIdx: number, colIdx: number) => () => {
    if (skipSelReset.current) { skipSelReset.current = false; return; }
    setSelAnchor({ row: rowIdx, col: colIdx });
    setSelCursor({ row: rowIdx, col: colIdx });
  }, []);

  // ── Mouse down: start drag-select, or Shift+Click to extend selection ───────
  const handleCellMouseDown = useCallback(
    (rowIdx: number, colIdx: number) => (e: React.MouseEvent) => {
      if (e.shiftKey && selAnchor) {
        skipSelReset.current = true;
        setSelCursor({ row: rowIdx, col: colIdx });
        return;
      }
      // Start a fresh drag-select from this cell (Excel-style click & drag)
      isDragging.current = true;
      skipSelReset.current = true;
      setSelAnchor({ row: rowIdx, col: colIdx });
      setSelCursor({ row: rowIdx, col: colIdx });
    },
    [selAnchor]
  );

  // ── Mouse enter while dragging: extend selection to this cell ───────────────
  const handleCellMouseEnter = useCallback(
    (rowIdx: number, colIdx: number) => () => {
      if (isDragging.current) {
        setSelCursor({ row: rowIdx, col: colIdx });
      }
    },
    []
  );

  // ── Keyboard handler ─────────────────────────────────────────────────────────
  const handleCellKeyDown = useCallback(
    (rowIdx: number, colIdx: number) =>
      (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
        const isCtrl  = e.ctrlKey || e.metaKey;
        const isShift = e.shiftKey;

        // ── Ctrl shortcuts ────────────────────────────────────────────────────
        if (isCtrl) {
          // Ctrl+A — select all cells
          if (e.key === "a" || e.key === "A") {
            e.preventDefault();
            setSelAnchor({ row: 0, col: 0 });
            setSelCursor({ row: rows.length - 1, col: COLUMNS.length - 1 });
            return;
          }
          // Ctrl+D — fill down
          if (e.key === "d" || e.key === "D") {
            e.preventDefault();
            fillDown();
            return;
          }
          // Ctrl+C — copy selection (only when multi-cell; single cell browser handles)
          if ((e.key === "c" || e.key === "C") && isMultiSel) {
            e.preventDefault();
            copySelectionToClipboard();
            return;
          }
        }

        // ── Arrow navigation ──────────────────────────────────────────────────
        const target = e.target as HTMLInputElement | HTMLSelectElement;
        const isSelect = target.tagName === "SELECT";

        if (e.key === "ArrowDown") {
          e.preventDefault();
          const next = clamp(rowIdx + 1, 0, rows.length - 1);
          if (isShift) {
            setSelCursor({ row: next, col: colIdx });
          } else {
            setSelAnchor({ row: next, col: colIdx });
            setSelCursor({ row: next, col: colIdx });
            focusCellByIdx(next, colIdx);
          }
          return;
        }

        if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = clamp(rowIdx - 1, 0, rows.length - 1);
          if (isShift) {
            setSelCursor({ row: prev, col: colIdx });
          } else {
            setSelAnchor({ row: prev, col: colIdx });
            setSelCursor({ row: prev, col: colIdx });
            focusCellByIdx(prev, colIdx);
          }
          return;
        }

        if (e.key === "ArrowRight") {
          const atEnd = isSelect ||
            (target as HTMLInputElement).selectionStart === target.value.length;
          if (atEnd) {
            const next = clamp(colIdx + 1, 0, COLUMNS.length - 1);
            if (next !== colIdx) {
              e.preventDefault();
              if (isShift) {
                setSelCursor({ row: rowIdx, col: next });
              } else {
                setSelAnchor({ row: rowIdx, col: next });
                setSelCursor({ row: rowIdx, col: next });
                focusCellByIdx(rowIdx, next);
              }
            }
          }
          return;
        }

        if (e.key === "ArrowLeft") {
          const atStart = isSelect ||
            (target as HTMLInputElement).selectionStart === 0;
          if (atStart) {
            const prev = clamp(colIdx - 1, 0, COLUMNS.length - 1);
            if (prev !== colIdx) {
              e.preventDefault();
              if (isShift) {
                setSelCursor({ row: rowIdx, col: prev });
              } else {
                setSelAnchor({ row: rowIdx, col: prev });
                setSelCursor({ row: rowIdx, col: prev });
                focusCellByIdx(rowIdx, prev);
              }
            }
          }
          return;
        }

        // ── Enter → move down ─────────────────────────────────────────────────
        if (e.key === "Enter" && !isShift) {
          e.preventDefault();
          const next = clamp(rowIdx + 1, 0, rows.length - 1);
          setSelAnchor({ row: next, col: colIdx });
          setSelCursor({ row: next, col: colIdx });
          focusCellByIdx(next, colIdx);
          return;
        }

        // ── Delete / Backspace on multi-cell selection → clear ────────────────
        if ((e.key === "Delete" || e.key === "Backspace") && isMultiSel) {
          e.preventDefault();
          clearSelectionCells();
          return;
        }
      },
    [rows, isMultiSel, fillDown, copySelectionToClipboard, clearSelectionCells, focusCellByIdx]
  );

  // ── Add rows ─────────────────────────────────────────────────────────────────
  const addRows = (count = 10) =>
    setRows((prev) => [...prev, ...Array.from({ length: count }, newRow)]);

  // ── Remove a row ─────────────────────────────────────────────────────────────
  const removeRow = (id: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r._id !== id) : prev));

  // ── Validate ─────────────────────────────────────────────────────────────────
  const handleValidate = () => {
    if (filledRows === 0) { toast.warning("Chưa có dữ liệu nào để kiểm tra"); return {}; }
    const errs = validateRows(rows);
    setErrors(errs);
    setValidated(true);
    const cnt = Object.keys(errs).length;
    if (cnt === 0) toast.success(`Dữ liệu hợp lệ — ${filledRows} dòng sẵn sàng tạo!`);
    else           toast.error(`Có ${cnt} dòng lỗi, vui lòng kiểm tra lại`);
    return errs;
  };

  // ── Go to first error ─────────────────────────────────────────────────────────
  const goToFirstError = useCallback(() => {
    const errs = validated ? errors : validateRows(rows);
    if (!validated) { setErrors(errs); setValidated(true); }
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri]!;
      const rowErr = errs[row._id];
      if (!rowErr) continue;
      for (let ci = 0; ci < COLUMNS.length; ci++) {
        if (rowErr[COLUMNS[ci]!.key]) {
          setSelAnchor({ row: ri, col: ci });
          setSelCursor({ row: ri, col: ci });
          focusCellByIdx(ri, ci);
          return;
        }
      }
    }
  }, [rows, errors, validated, focusCellByIdx]);

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errs = validateRows(rows);
    setErrors(errs);
    setValidated(true);
    if (Object.keys(errs).length > 0) {
      toast.error(`Có ${Object.keys(errs).length} dòng lỗi, vui lòng kiểm tra lại`);
      goToFirstError();
      return;
    }
    const payload = rows
      .filter((r) => !isRowEmpty(r))
      .map((r) => ({
        name: r.name.trim(),
        ...(r.email          && { email:          r.email.trim() }),
        ...(r.phone          && { phone:          r.phone.trim() }),
        ...(r.company_name   && { company_name:   r.company_name.trim() }),
        ...(r.job_title      && { job_title:      r.job_title.trim() }),
        ...(r.industry       && { industry:       r.industry.trim() }),
        ...(r.company_size   && { company_size:   r.company_size }),
        ...(r.annual_revenue && { annual_revenue: parseFloat(r.annual_revenue.replace(/,/g, "")) }),
        ...(r.source_id      && { source_id:      parseInt(r.source_id) }),
      }));
    if (payload.length === 0) { toast.warning("Chưa có dữ liệu nào để tạo"); return; }
    setSubmitting(true);
    try {
      const res = await leadApi.bulkCreateLeads(payload);
      setResult(res.data.data as BulkResult);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Lỗi khi tạo leads, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Result screen ────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            {result.errorCount === 0
              ? <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
              : <AlertCircle className="w-14 h-14 text-amber-500 mx-auto mb-3" />}
            <h2 className="text-xl font-semibold text-gray-900">Kết quả tạo hàng loạt</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{result.successCount}</p>
              <p className="text-xs text-green-700 mt-1">Tạo thành công</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{result.errorCount}</p>
              <p className="text-xs text-red-700 mt-1">Thất bại</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mb-5 max-h-40 overflow-y-auto space-y-1">
              {result.errors.map((e) => (
                <div key={e.index} className="text-xs text-red-600 bg-red-50 rounded px-3 py-1.5">
                  <span className="font-medium">#{e.index + 1} {e.name}:</span> {e.message}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => navigate("/crm/leads")}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
              Về danh sách Lead
            </button>
            <button onClick={() => { setResult(null); setRows(Array.from({ length: 15 }, newRow)); setErrors({}); setValidated(false); }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Tạo thêm
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main page ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden select-none">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/crm/leads")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Về danh sách Lead
          </button>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-2">
            <TableProperties className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-gray-800">Tạo hàng loạt Lead</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {isMultiSel && selRange && (
            <span className="text-blue-600 font-medium">
              {selRange.endRow - selRange.startRow + 1} × {selRange.endCol - selRange.startCol + 1} ô được chọn
            </span>
          )}
          <span><span className="font-semibold text-gray-700">{filledRows}</span> dòng có dữ liệu</span>
          {validated && errorCount > 0  && <span className="text-red-500 font-medium">{errorCount} dòng lỗi</span>}
          {validated && errorCount === 0 && filledRows > 0 && (
            <span className="text-green-600 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Hợp lệ
            </span>
          )}
        </div>
      </div>

      {/* ── Shortcut hint ── */}
      <div className="px-5 py-1.5 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 flex flex-wrap items-center gap-x-4 gap-y-1 shrink-0">
        {[
          ["Ctrl+V", "Dán từ Excel"],
          ["Ctrl+C", "Sao chép vùng chọn"],
          ["Ctrl+A", "Chọn tất cả"],
          ["Ctrl+D", "Điền xuống"],
          ["Shift+Click/Mũi tên", "Chọn vùng"],
          ["Delete", "Xóa vùng chọn"],
          ["Enter / ↓↑←→", "Di chuyển ô"],
        ].map(([key, desc]) => (
          <span key={key}>
            <kbd className="bg-white border border-blue-200 rounded px-1 font-mono">{key}</kbd>
            <span className="ml-1 text-blue-600">{desc}</span>
          </span>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto">
        <table className="border-collapse min-w-full text-xs" style={{ tableLayout: "fixed" }}>
          <colgroup><col style={{ width: 44 }} />{COLUMNS.map((c) => <col key={c.key} style={{ width: c.width }} />)}<col style={{ width: 36 }} /></colgroup>

          {/* Sticky header */}
          <thead className="sticky top-0 z-10 bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-2 py-2 text-center text-gray-500 font-medium">STT</th>
              {COLUMNS.map((c) => (
                <th key={c.key}
                  className="border border-gray-300 px-2 py-2 text-left text-gray-700 font-semibold whitespace-nowrap">
                  {c.label}{c.required && <span className="text-red-500 ml-0.5">*</span>}
                </th>
              ))}
              <th className="border border-gray-300 px-1 py-2" />
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIdx) => {
              const rowErr = errors[row._id];
              return (
                <tr key={row._id}
                  className={rowErr ? "bg-red-50/40" : rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/40"}>

                  {/* STT */}
                  <td className="border border-gray-200 px-2 py-0 text-center text-gray-400 select-none text-xs">
                    {rowIdx + 1}
                  </td>

                  {/* Data cells */}
                  {COLUMNS.map((col, colIdx) => {
                    const cellErr = rowErr?.[col.key];
                    const selected = isCellSelected(rowIdx, colIdx);

                    const tdClass = [
                      "border border-gray-200 p-0 relative",
                      cellErr  ? "border-red-400"  : "",
                      selected ? "bg-blue-100 border-blue-300" : "",
                    ].join(" ");

                    const inputClass = [
                      "w-full h-8 px-2 bg-transparent text-gray-800 placeholder:text-gray-300",
                      "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400",
                      cellErr ? "text-red-700" : "",
                    ].join(" ");

                    const commonProps = {
                      ref: setCellRef(row._id, col.key) as any,
                      onFocus:     handleCellFocus(rowIdx, colIdx),
                      onKeyDown:   handleCellKeyDown(rowIdx, colIdx),
                      onPaste:     handlePaste(rowIdx, colIdx) as any,
                    };

                    return (
                      <td key={col.key} className={tdClass} title={cellErr}
                        onMouseDown={handleCellMouseDown(rowIdx, colIdx)}
                        onMouseEnter={handleCellMouseEnter(rowIdx, colIdx)}
                      >
                        {col.type === "select" ? (
                          <select {...commonProps} value={row[col.key]}
                            onChange={(e) => updateCell(row._id, col.key, e.target.value)}
                            className={inputClass + " cursor-pointer"}>
                            <option value="">—</option>
                            {col.options!.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        ) : col.type === "select-source" ? (
                          <select {...commonProps} value={row[col.key]}
                            onChange={(e) => updateCell(row._id, col.key, e.target.value)}
                            className={inputClass + " cursor-pointer"}>
                            <option value="">—</option>
                            {sources.map((s) => (
                              <option key={s.id} value={String(s.id)}>{s.name}</option>
                            ))}
                          </select>
                        ) : col.type === "number" ? (
                          <input {...commonProps} type="text"
                            inputMode="decimal"
                            value={formatNumberInput(row[col.key])}
                            onChange={(e) => updateCell(row._id, col.key, parseNumberInput(e.target.value)?.toString() ?? "")}
                            placeholder={col.required ? "Nhập..." : ""}
                            className={inputClass + " text-right"}
                          />
                        ) : (
                          <input {...commonProps} type="text"
                            value={row[col.key]}
                            onChange={(e) => updateCell(row._id, col.key, e.target.value)}
                            placeholder={col.required ? "Nhập..." : ""}
                            className={inputClass}
                          />
                        )}
                        {cellErr && (
                          <AlertCircle className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-red-400 pointer-events-none" />
                        )}
                      </td>
                    );
                  })}

                  {/* Delete row */}
                  <td className="border border-gray-200 p-0 text-center">
                    <button onClick={() => removeRow(row._id)} tabIndex={-1}
                      className="w-full h-8 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Bottom toolbar ── */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 flex items-center justify-between gap-3">
        {/* Left */}
        <div className="flex items-center gap-2">
          {/* Thêm dòng — nhập số lượng tuỳ ý */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden hover:border-gray-400 transition-colors">
            <span className="px-2.5 text-xs text-gray-500 bg-gray-50 border-r border-gray-300 h-full flex items-center select-none">
              <Plus className="w-3.5 h-3.5 mr-1" /> Thêm
            </span>
            <input
              type="number"
              min={1}
              max={500}
              value={addCount}
              onChange={(e) => setAddCount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const n = Math.max(1, Math.min(500, parseInt(addCount) || 10));
                  addRows(n);
                }
              }}
              className="w-14 h-[30px] px-2 text-sm text-center text-gray-700 focus:outline-none bg-white"
            />
            <button
              onClick={() => {
                const n = Math.max(1, Math.min(500, parseInt(addCount) || 10));
                addRows(n);
              }}
              className="px-2.5 text-xs font-medium text-gray-600 bg-gray-50 border-l border-gray-300 h-full flex items-center hover:bg-gray-100 transition-colors select-none"
            >
              dòng
            </button>
          </div>
          <button onClick={goToFirstError}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Search className="w-3.5 h-3.5" /> Tìm ô lỗi
          </button>
          {isMultiSel && (
            <button onClick={copySelectionToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
              <Copy className="w-3.5 h-3.5" /> Sao chép vùng chọn
            </button>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button onClick={handleValidate}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-orange-600 border border-orange-400 rounded-lg hover:bg-orange-50 transition-colors">
            <CheckCircle className="w-3.5 h-3.5" /> Kiểm tra dữ liệu
          </button>

          {canSubmit && (
            <button onClick={handleSubmit} disabled={submitting}
              className={[
                "flex items-center gap-1.5 px-5 py-1.5 text-sm font-semibold rounded-lg transition-colors",
                submitting
                  ? "bg-orange-300 text-white cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm",
              ].join(" ")}>
              {submitting
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tạo...</>
                : <><TableProperties className="w-3.5 h-3.5" /> Tạo {filledRows} Lead</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
