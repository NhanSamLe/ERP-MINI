import { X, FileText, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CreateInvoiceMethodModalProps {
  open: boolean;
  onClose: () => void;
  onSelectFromPo: () => void;
  onSelectFromOcr: () => void;
}

export default function CreateInvoiceMethodModal({
  open,
  onClose,
  onSelectFromPo,
  onSelectFromOcr,
}: CreateInvoiceMethodModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Create AP Invoice</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-gray-600 mb-8 text-center">
            Choose how you want to create the invoice
          </p>

          <div className="grid grid-cols-2 gap-6">
            {/* From PO Option */}
            <button
              onClick={onSelectFromPo}
              className="group relative p-6 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <FileText className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    From Purchase Order
                  </h3>
                  <p className="text-sm text-gray-600">
                    Create invoice from an existing confirmed or completed PO
                  </p>
                </div>
              </div>
            </button>

            {/* From OCR Option */}
            <button
              onClick={onSelectFromOcr}
              className="group relative p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <ScanLine className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    From OCR Scan
                  </h3>
                  <p className="text-sm text-gray-600">
                    Upload and scan invoice document using AI OCR
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} className="px-6">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
