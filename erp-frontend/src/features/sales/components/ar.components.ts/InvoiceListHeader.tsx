import { Plus, Download } from "lucide-react";

interface Props {
  onCreateNew: () => void;
  onExport?: () => void;
}

function InvoiceListHeader({ onCreateNew, onExport }: Props) {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invoice List</h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage all sales invoices
          </p>
        </div>

        <div className="flex gap-2">
          {onExport && (
            <button
              onClick={onExport}
              className="bg-white border border-orange-300 text-orange-700 hover:bg-orange-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download size={18} />
              Export Excel
            </button>
          )}

          <button
            onClick={onCreateNew}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            New Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

export default InvoiceListHeader;
