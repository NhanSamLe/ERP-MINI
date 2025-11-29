import React from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SubmitConfirmModal({ open, onClose, onConfirm }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
        <h2 className="text-lg font-semibold mb-3">Submit Sale Order</h2>

        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to submit this sale order for approval?
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onConfirm();
            }}
            className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
