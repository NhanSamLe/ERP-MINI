import { Loader2, History } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: number;
  action: string;
  /** "old/status" → "new/status" (AP Payment style) */
  old_status?: string | null;
  new_status?: string | null;
  /** PO style: old_values / new_values JSON */
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  /** AP Invoice style */
  source?: string | null;
  ocr_confidence?: number | null;
  matching_status?: string | null;
  override_reason?: string | null;
  /** AP Payment style */
  details?: Record<string, any> | null;
  /** Actor */
  actor?: { id: number; full_name: string; email?: string } | null;
  /** PO style uses changed_by_name */
  changed_by_name?: string;
  created_at?: string;
  changed_at?: string;
}

export type AuditLogVariant = "payment" | "invoice" | "po";

interface AuditLogTimelineProps {
  logs: AuditLogEntry[];
  loading?: boolean;
  variant?: AuditLogVariant;
}

// ─── TRANSLATION HELPER ──────────────────────────────────────────────────────

const TRANSLATION_MAP: Record<string, string> = {
  // Statuses
  draft: "Nháp",
  waiting_approval: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Đã từ chối",
  posted: "Đã ghi sổ",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  confirmed: "Đã xác nhận",
  sent: "Đã gửi",
  supplier_accepted: "NCC đã nhận",
  partially_received: "Nhận một phần",
  received: "Đã nhận",
  pending: "Chờ đối chiếu",
  matched: "Khớp",
  mismatch: "Lệch",
  // Other fields
  status: "Trạng thái",
  approval_status: "Trạng thái duyệt",
  payment_status: "Trạng thái thanh toán",
  allocation_status: "Trạng thái phân bổ",
  recipient: "Người nhận",
  sent_at: "Gửi lúc",
};

function formatStatus(statusStr: string | null | undefined): string {
  if (!statusStr) return "";
  if (statusStr.includes("/")) {
    const parts = statusStr.split("/");
    const translatedParts = parts.map(
      (p) => TRANSLATION_MAP[p.toLowerCase()] || p
    );
    if (translatedParts[0] === translatedParts[1]) {
      return translatedParts[0];
    }
    return `${translatedParts[0]} (${translatedParts[1]})`;
  }
  return TRANSLATION_MAP[statusStr.toLowerCase()] || statusStr;
}

function translateValue(key: string, val: any): string {
  if (val === null || val === undefined) return "—";
  const strVal = String(val).toLowerCase();
  
  if (key.includes("status") || key === "state" || TRANSLATION_MAP[strVal]) {
    return TRANSLATION_MAP[strVal] || String(val);
  }
  
  // Format date-time fields
  if (
    (key.includes("date") || key.includes("_at") || key.includes("time")) &&
    typeof val === "string" &&
    !isNaN(Date.parse(val))
  ) {
    try {
      return new Date(val).toLocaleString("vi-VN");
    } catch {
      return String(val);
    }
  }
  
  return String(val);
}

function translateKey(key: string): string {
  return TRANSLATION_MAP[key.toLowerCase()] || key.replace(/_/g, " ");
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  waiting_approval: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
  posted: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  confirmed: "bg-teal-50 text-teal-700 border-teal-200",
  sent: "bg-sky-50 text-sky-700 border-sky-200",
  supplier_accepted: "bg-indigo-50 text-indigo-700 border-indigo-200",
  partially_received: "bg-purple-50 text-purple-700 border-purple-200",
  received: "bg-sky-50 text-sky-700 border-sky-200",
};

function renderStatusBadge(statusStr: string | null | undefined) {
  if (!statusStr) return null;
  
  if (statusStr.includes("/")) {
    const parts = statusStr.split("/");
    const p1 = parts[0].toLowerCase();
    const p2 = parts[1].toLowerCase();
    const label1 = TRANSLATION_MAP[p1] || parts[0];
    const label2 = TRANSLATION_MAP[p2] || parts[1];
    
    if (p1 === p2) {
      const cls = STATUS_COLORS[p1] || "bg-gray-50 text-gray-600 border-gray-200";
      return (
        <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-semibold ${cls}`}>
          {label1}
        </span>
      );
    } else {
      const cls1 = STATUS_COLORS[p1] || "bg-gray-50 text-gray-600 border-gray-200";
      const cls2 = STATUS_COLORS[p2] || "bg-gray-50 text-gray-600 border-gray-200";
      return (
        <span className="inline-flex gap-1 items-center">
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${cls1}`}>
            {label1}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">/</span>
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${cls2}`}>
            {label2}
          </span>
        </span>
      );
    }
  }

  const key = statusStr.toLowerCase();
  const cls = STATUS_COLORS[key] || "bg-gray-50 text-gray-600 border-gray-200";
  const label = TRANSLATION_MAP[key] || statusStr;
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ─── Action config per variant ────────────────────────────────────────────────

const PAYMENT_ACTIONS: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  CREATE: {
    label: "Đã tạo",
    color: "bg-blue-100 text-blue-700",
    dot: "border-blue-400",
  },
  SUBMIT: {
    label: "Đã gửi",
    color: "bg-yellow-100 text-yellow-700",
    dot: "border-yellow-400",
  },
  APPROVE: {
    label: "Đã phê duyệt",
    color: "bg-green-100 text-green-700",
    dot: "border-green-400",
  },
  REJECT: {
    label: "Đã từ chối",
    color: "bg-red-100 text-red-700",
    dot: "border-red-400",
  },
  ALLOCATE: {
    label: "Đã phân bổ",
    color: "bg-purple-100 text-purple-700",
    dot: "border-purple-400",
  },
  COMPLETE: {
    label: "Đã hoàn thành",
    color: "bg-emerald-100 text-emerald-700",
    dot: "border-emerald-400",
  },
};

const INVOICE_ACTIONS: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  created: {
    label: "Hóa đơn đã tạo",
    color: "bg-blue-100 text-blue-700",
    dot: "border-blue-400",
  },
  auto_created: {
    label: "Tự động tạo (OCR)",
    color: "bg-purple-100 text-purple-700",
    dot: "border-purple-400",
  },
  override_duplicate: {
    label: "Ghi đè trùng lặp",
    color: "bg-yellow-100 text-yellow-700",
    dot: "border-yellow-400",
  },
  mismatch_accepted: {
    label: "Chấp nhận sai lệch",
    color: "bg-orange-100 text-orange-700",
    dot: "border-orange-400",
  },
  manual_override: {
    label: "Ghi đè thủ công",
    color: "bg-gray-100 text-gray-700",
    dot: "border-gray-400",
  },
};

const PO_ACTIONS: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  CREATE: {
    label: "PO đã tạo",
    color: "bg-blue-100 text-blue-700",
    dot: "border-blue-400",
  },
  UPDATE: {
    label: "PO đã cập nhật",
    color: "bg-indigo-100 text-indigo-700",
    dot: "border-indigo-400",
  },
  APPROVE: {
    label: "PO đã phê duyệt",
    color: "bg-green-100 text-green-700",
    dot: "border-green-400",
  },
  CANCEL: {
    label: "PO đã hủy",
    color: "bg-red-100 text-red-700",
    dot: "border-red-400",
  },
  SEND_EMAIL: {
    label: "Gửi Email",
    color: "bg-teal-100 text-teal-700",
    dot: "border-teal-400",
  },
};

function getActionMeta(action: string, variant: AuditLogVariant) {
  const map =
    variant === "payment"
      ? PAYMENT_ACTIONS
      : variant === "invoice"
        ? INVOICE_ACTIONS
        : PO_ACTIONS;
  return (
    map[action] ?? {
      label: action,
      color: "bg-gray-100 text-gray-700",
      dot: "border-gray-400",
    }
  );
}

// ─── Detail renderers ─────────────────────────────────────────────────────────

function PaymentDetails({ log }: { log: AuditLogEntry }) {
  const d = log.details;
  if (!d) return null;
  return (
    <div className="mt-1.5 space-y-0.5">
      {d.reject_reason && (
        <p className="text-xs text-red-500 italic">"{d.reject_reason}"</p>
      )}
      {d.allocations && Array.isArray(d.allocations) && (
        <div className="text-xs text-gray-500 space-y-0.5">
          {d.allocations.map((a: any, i: number) => (
            <span key={i} className="inline-flex items-center gap-1 mr-2">
              <span className="font-medium text-gray-700">
                {a.invoice_id ? `HĐ #${a.invoice_id}` : "Hóa đơn"}
              </span>
              <span>→</span>
              <span className="text-purple-600 font-medium">
                {Number(a.amount).toLocaleString("vi-VN", {
                  minimumFractionDigits: 2,
                })}
              </span>
              {a.status && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    a.status === "paid"
                      ? "bg-green-100 text-green-700"
                      : a.status === "partially_paid"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {a.status === "paid"
                    ? "ĐÃ THANH TOÁN"
                    : a.status === "partially_paid"
                      ? "THANH TOÁN MỘT PHẦN"
                      : a.status.replace(/_/g, " ").toUpperCase()}
                </span>
              )}
            </span>
          ))}
          {d.total_allocated != null && (
            <p className="text-gray-500">
              Tổng phân bổ:{" "}
              <span className="font-semibold text-gray-700">
                {Number(d.total_allocated).toLocaleString("vi-VN", {
                  minimumFractionDigits: 2,
                })}
              </span>
              {d.remaining != null && (
                <span className="ml-2">
                  · Còn lại:{" "}
                  <span
                    className={`font-semibold ${d.remaining === 0 ? "text-green-600" : "text-orange-600"}`}
                  >
                    {Number(d.remaining).toLocaleString("vi-VN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </span>
              )}
            </p>
          )}
        </div>
      )}
      {d.gl_entry_no && (
        <p className="text-xs text-gray-500">
          Bút toán GL:{" "}
          <span className="font-medium text-gray-700">{d.gl_entry_no}</span>
        </p>
      )}
    </div>
  );
}

function InvoiceDetails({ log }: { log: AuditLogEntry }) {
  return (
    <div className="mt-1.5 space-y-0.5">
      {log.source && (
        <span className="text-xs text-gray-500 mr-2">
          Nguồn:{" "}
          <span className="font-medium">
            {log.source === "ai_ocr" ? "OCR" : "Thủ công"}
          </span>
        </span>
      )}
      {log.ocr_confidence != null && (
        <span className="text-xs text-gray-500 mr-2">
          Độ chính xác:{" "}
          <span
            className={`font-medium ${log.ocr_confidence >= 0.85 ? "text-green-600" : log.ocr_confidence >= 0.6 ? "text-yellow-600" : "text-red-600"}`}
          >
            {Math.round(log.ocr_confidence * 100)}%
          </span>
        </span>
      )}
      {log.matching_status && (
        <span
          className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium mr-2 ${
            log.matching_status === "matched"
              ? "bg-green-100 text-green-700"
              : log.matching_status === "mismatch"
                ? "bg-red-100 text-red-700"
                : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {TRANSLATION_MAP[log.matching_status.toLowerCase()] || log.matching_status.toUpperCase()}
        </span>
      )}
      {log.override_reason && (
        <p className="text-xs text-orange-600 italic">
          Lý do: "{log.override_reason}"
        </p>
      )}
    </div>
  );
}

function PoDetails({ log }: { log: AuditLogEntry }) {
  const hasChanges = log.old_values || log.new_values;
  if (!hasChanges) return null;

  // Show a compact diff of changed fields
  const allKeys = new Set([
    ...Object.keys(log.old_values ?? {}),
    ...Object.keys(log.new_values ?? {}),
  ]);

  const changedFields = [...allKeys].filter(
    (k) =>
      JSON.stringify((log.old_values ?? {})[k]) !==
      JSON.stringify((log.new_values ?? {})[k]),
  );

  if (changedFields.length === 0) return null;

  return (
    <div className="mt-1.5 space-y-1">
      {changedFields.slice(0, 4).map((key) => {
        const oldVal = (log.old_values ?? {})[key];
        const newVal = (log.new_values ?? {})[key];
        const isStatusField = key === "status" || key === "approval_status" || key === "payment_status";
        return (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 capitalize">
              {translateKey(key)}:
            </span>
            {oldVal != null && (
              isStatusField ? renderStatusBadge(String(oldVal)) : (
                <span className="line-through text-red-400 font-medium">
                  {translateValue(key, oldVal)}
                </span>
              )
            )}
            {oldVal != null && newVal != null && (
              <span className="text-gray-400">→</span>
            )}
            {newVal != null && (
              isStatusField ? renderStatusBadge(String(newVal)) : (
                <span className="text-green-600 font-medium">
                  {translateValue(key, newVal)}
                </span>
              )
            )}
          </div>
        );
      })}
      {changedFields.length > 4 && (
        <p className="text-xs text-gray-400">
          +{changedFields.length - 4} trường khác
        </p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AuditLogTimeline({
  logs,
  loading = false,
  variant = "payment",
}: AuditLogTimelineProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm py-6">
        <Loader2 className="w-4 h-4 animate-spin" />
        Đang tải hoạt động...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic py-4">
        Chưa có hoạt động nào được ghi nhận.
      </p>
    );
  }

  return (
    <ol className="relative border-l-2 border-gray-100 space-y-5 ml-3">
      {logs.map((log) => {
        const meta = getActionMeta(log.action, variant);
        const actorName =
          log.actor?.full_name ?? log.changed_by_name ?? "Chưa rõ";
        const timestamp = log.created_at ?? log.changed_at;

        return (
          <li key={log.id} className="ml-5">
            {/* Timeline dot */}
            <span
              className={`absolute -left-[9px] w-4 h-4 rounded-full bg-white border-2 ${meta.dot}`}
            />

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Action badge */}
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${meta.color}`}
                >
                  {meta.label}
                </span>

                {/* Status transition (payment) */}
                {log.old_status && log.new_status && (() => {
                  const oldParts = log.old_status.split("/");
                  const newParts = log.new_status.split("/");
                  const statusChanged = oldParts[0] !== newParts[0];
                  const approvalChanged = oldParts[1] !== newParts[1];
                  
                  return (
                    <div className="space-y-1 mt-1">
                      {statusChanged && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="font-medium text-gray-400">Trạng thái:</span>
                          {renderStatusBadge(oldParts[0])}
                          <span className="text-gray-400">→</span>
                          {renderStatusBadge(newParts[0])}
                        </div>
                      )}
                      {approvalChanged && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="font-medium text-gray-400">Phê duyệt:</span>
                          {renderStatusBadge(oldParts[1])}
                          <span className="text-gray-400">→</span>
                          {renderStatusBadge(newParts[1])}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Variant-specific details */}
                {variant === "payment" && <PaymentDetails log={log} />}
                {variant === "invoice" && <InvoiceDetails log={log} />}
                {variant === "po" && <PoDetails log={log} />}

                {/* Actor */}
                <p className="text-xs text-gray-400 mt-1">
                  bởi{" "}
                  <span className="font-medium text-gray-600">{actorName}</span>
                </p>
              </div>

              {/* Timestamp */}
              {timestamp && (
                <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                  {new Date(timestamp).toLocaleString("vi-VN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ─── Wrapper card (reusable) ──────────────────────────────────────────────────

interface AuditLogCardProps extends AuditLogTimelineProps {
  title?: string;
}

export function AuditLogCard({
  title = "Nhật ký hoạt động",
  logs,
  loading,
  variant,
}: AuditLogCardProps) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
          <History className="w-5 h-5 text-gray-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {!loading && logs.length > 0 && (
          <span className="ml-auto text-xs text-gray-400 font-medium">
            {logs.length} bản ghi
          </span>
        )}
      </div>
      <AuditLogTimeline logs={logs} loading={loading} variant={variant} />
    </div>
  );
}
