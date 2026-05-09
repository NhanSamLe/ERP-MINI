import { ReactNode, useState } from "react";
import { AlertTriangle, Trash2, CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger" | "success" | "warning";
  loading?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
}

const variantConfig = {
  primary: {
    btn:       "bg-orange-500 hover:bg-orange-600 text-white",
    icon:      <AlertCircle className="w-5 h-5 text-orange-500" />,
    iconWrap:  "bg-orange-50",
  },
  danger: {
    btn:       "bg-red-600 hover:bg-red-700 text-white",
    icon:      <Trash2 className="w-5 h-5 text-red-600" />,
    iconWrap:  "bg-red-50",
  },
  success: {
    btn:       "bg-emerald-600 hover:bg-emerald-700 text-white",
    icon:      <CheckCircle className="w-5 h-5 text-emerald-600" />,
    iconWrap:  "bg-emerald-50",
  },
  warning: {
    btn:       "bg-amber-500 hover:bg-amber-600 text-white",
    icon:      <AlertTriangle className="w-5 h-5 text-amber-500" />,
    iconWrap:  "bg-amber-50",
  },
};

export function ActionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  loading = false,
  requireReason = false,
  reasonLabel = "Reason",
  reasonPlaceholder = "Please provide a reason...",
}: Props) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const { btn, icon, iconWrap } = variantConfig[variant];

  const handleConfirm = () => onConfirm(requireReason ? reason : undefined);

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const isDisabled = loading || (requireReason && !reason.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4">
          <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconWrap}`}>
            {icon}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <div className="mt-1 text-sm text-gray-600 leading-relaxed">{description}</div>
          </div>
          <button
            onClick={handleClose}
            className="shrink-0 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reason input */}
        {requireReason && (
          <div className="px-5 pb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              {reasonLabel} <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[80px] resize-none placeholder:text-gray-400"
              placeholder={reasonPlaceholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3.5 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="h-8 px-4 rounded-md text-sm font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDisabled}
            className={[
              "h-8 px-4 rounded-md text-sm font-medium transition-colors",
              "inline-flex items-center gap-1.5",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              btn,
            ].join(" ")}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
