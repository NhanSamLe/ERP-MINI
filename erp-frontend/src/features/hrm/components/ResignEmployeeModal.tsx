import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResignFormData {
  resign_date: string;
  resign_reason?: string;
}

interface ResignEmployeeModalProps {
  open: boolean;
  employeeName?: string;
  onClose: () => void;
  onSubmit: (data: ResignFormData) => Promise<void>;
}

interface FormErrors {
  resign_date?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

function getTodayIso(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name }: { name?: string }) {
  return (
    <div className="resign-avatar" aria-hidden="true">
      {getInitials(name)}
    </div>
  );
}

function WarningBanner() {
  return (
    <div className="resign-warning" role="alert">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span>
        This action cannot be undone. The employee will be terminated starting
        from the selected date.
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ResignEmployeeModal({
  open,
  employeeName,
  onClose,
  onSubmit,
}: ResignEmployeeModalProps) {
  const [resignDate, setResignDate] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setResignDate("");
      setReason("");
      setErrors({});
      setSubmitError(null);
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, loading, onClose]);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!resignDate) {
      newErrors.resign_date = "Please select a resignation date";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [resignDate]);

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setSubmitError(null);

    try {
      await onSubmit({
        resign_date: resignDate,
        resign_reason: reason.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "An error occurred, please try again"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResignDate(e.target.value);
    if (errors.resign_date) setErrors((prev) => ({ ...prev, resign_date: undefined }));
  };

  if (!open) return null;

  return (
    <>
      {/* ── Styles ── */}
      <style>{`
        .resign-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 1rem;
          animation: resign-fade-in 0.15s ease;
        }

        @keyframes resign-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .resign-modal {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-width: 460px;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.06),
            0 8px 24px rgba(0,0,0,0.12),
            0 24px 48px rgba(0,0,0,0.08);
          animation: resign-slide-up 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
        }

        @keyframes resign-slide-up {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Header ── */
        .resign-header {
          padding: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          border-bottom: 1px solid #f0f0f0;
        }

        .resign-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: #fff1f1;
          border: 1px solid #fecaca;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #dc2626;
        }

        .resign-header-text { flex: 1; }

        .resign-title {
          font-size: 15px;
          font-weight: 600;
          color: #111;
          margin: 0 0 2px;
          letter-spacing: -0.01em;
        }

        .resign-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }

        .resign-close {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          flex-shrink: 0;
          transition: background 0.1s, color 0.1s;
        }
        .resign-close:hover { background: #f5f5f5; color: #374151; }
        .resign-close:focus-visible {
          outline: 2px solid #dc2626;
          outline-offset: 2px;
        }

        /* ── Employee badge ── */
        .resign-employee {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          padding: 5px 10px 5px 5px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
        }

        .resign-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          letter-spacing: 0;
        }

        .resign-employee-name {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }

        /* ── Body ── */
        .resign-body {
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* ── Field ── */
        .resign-field { display: flex; flex-direction: column; gap: 6px; }

        .resign-label {
          font-size: 12.5px;
          font-weight: 500;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .resign-optional {
          font-weight: 400;
          color: #9ca3af;
          font-size: 12px;
        }

        .resign-input-wrap { position: relative; }

        .resign-input,
        .resign-textarea {
          width: 100%;
          padding: 9px 12px;
          font-size: 14px;
          font-family: inherit;
          color: #111;
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          line-height: 1.5;
        }

        .resign-input:hover,
        .resign-textarea:hover { border-color: #d1d5db; }

        .resign-input:focus,
        .resign-textarea:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        .resign-input--error {
          border-color: #dc2626 !important;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.08) !important;
        }

        .resign-textarea { resize: vertical; min-height: 88px; }

        .resign-input-icon {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
        }

        .resign-error-msg {
          font-size: 12px;
          color: #dc2626;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* ── Warning ── */
        .resign-warning {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 8px;
          font-size: 12.5px;
          color: #92400e;
          line-height: 1.5;
        }
        .resign-warning svg { flex-shrink: 0; margin-top: 1px; }

        /* ── Submit error ── */
        .resign-submit-error {
          padding: 10px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          font-size: 13px;
          color: #dc2626;
        }

        /* ── Footer ── */
        .resign-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          padding: 1rem 1.5rem;
          background: #f9fafb;
          border-top: 1px solid #f0f0f0;
        }

        .resign-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          font-size: 14px;
          font-family: inherit;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          border: none;
          transition: background 0.12s, transform 0.1s, opacity 0.1s;
          white-space: nowrap;
        }

        .resign-btn:focus-visible {
          outline: 2px solid #dc2626;
          outline-offset: 2px;
        }

        .resign-btn:active:not(:disabled) { transform: scale(0.98); }
        .resign-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .resign-btn--cancel {
          background: #fff;
          color: #374151;
          border: 1.5px solid #e5e7eb;
        }
        .resign-btn--cancel:hover:not(:disabled) { background: #f5f5f5; }

        .resign-btn--confirm {
          background: #dc2626;
          color: #fff;
        }
        .resign-btn--confirm:hover:not(:disabled) { background: #b91c1c; }

        .resign-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Overlay (click outside to close) ── */}
      <div
        className="resign-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resign-title"
        onClick={(e) => {
          if (e.target === e.currentTarget && !loading) onClose();
        }}
      >
        <div className="resign-modal">

          {/* Header */}
          <div className="resign-header">
            <div className="resign-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="17" y1="11" x2="23" y2="11" />
              </svg>
            </div>

            <div className="resign-header-text">
              <h2 id="resign-title" className="resign-title">
                Confirm Resignation
              </h2>
              <p className="resign-subtitle">
                Enter information to complete the employee resignation process
              </p>
              {employeeName && (
                <div className="resign-employee">
                  <Avatar name={employeeName} />
                  <span className="resign-employee-name">{employeeName}</span>
                </div>
              )}
            </div>

            <button
              className="resign-close"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="resign-body">

            {/* Date field */}
            <div className="resign-field">
              <label htmlFor="resign-date" className="resign-label">
                Resignation Date
                <span style={{ color: "#dc2626" }} aria-hidden="true"> *</span>
              </label>
              <div className="resign-input-wrap">
                <input
                  id="resign-date"
                  type="date"
                  className={`resign-input${errors.resign_date ? " resign-input--error" : ""}`}
                  value={resignDate}
                  min={getTodayIso()}
                  onChange={handleDateChange}
                  aria-describedby={errors.resign_date ? "resign-date-error" : undefined}
                  aria-invalid={!!errors.resign_date}
                  style={{ paddingRight: "36px" }}
                />
                <span className="resign-input-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
              </div>
              {errors.resign_date && (
                <span id="resign-date-error" className="resign-error-msg" role="alert">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" stroke="#fff" strokeWidth="2" />
                    <line x1="12" y1="16" x2="12.01" y2="16" stroke="#fff" strokeWidth="2" />
                  </svg>
                  {errors.resign_date}
                </span>
              )}
            </div>

            {/* Reason field */}
            <div className="resign-field">
              <label htmlFor="resign-reason" className="resign-label">
                Reason for Resignation
                <span className="resign-optional">(optional)</span>
              </label>
              <textarea
                id="resign-reason"
                className="resign-textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for resignation..."
                maxLength={500}
              />
            </div>

            <WarningBanner />

            {/* API error */}
            {submitError && (
              <div className="resign-submit-error" role="alert">
                {submitError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="resign-footer">
            <button
              className="resign-btn resign-btn--cancel"
              onClick={onClose}
              disabled={loading}
              type="button"
            >
              Cancel
            </button>
            <button
              className="resign-btn resign-btn--confirm"
              onClick={handleSubmit}
              disabled={loading}
              type="button"
            >
              {loading ? (
                <>
                  <span className="resign-spinner" aria-hidden="true" />
                  Processing...
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Confirm Resignation
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}