import React, { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function RejectReasonModal({ open, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
        <h2 className="text-lg font-semibold mb-3">Reject Sale Order</h2>

        <label className="text-sm text-gray-600">Reason</label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border rounded p-2 mt-1"
          placeholder="Enter reason..."
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onConfirm(reason);
              setReason("");
            }}
            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            disabled={reason.trim().length === 0}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
