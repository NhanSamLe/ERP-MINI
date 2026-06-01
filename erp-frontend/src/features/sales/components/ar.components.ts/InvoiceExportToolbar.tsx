import { useState } from "react";
import { ArInvoiceDto } from "../../dto/invoice.dto";
import { useInvoiceExport, InvoiceLang } from "../../hook/useInvoiceExport";
import { FileDown, Sheet, Printer, Loader2, ChevronDown } from "lucide-react";

interface Props {
  invoice: ArInvoiceDto;
}

const LANG_OPTIONS: { value: InvoiceLang; label: string; flag: string }[] = [
  { value: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { value: "en", label: "English",    flag: "🇬🇧" },
];

export default function InvoiceExportToolbar({ invoice }: Props) {
  const { exporting, exportToPDF, exportToExcel, printInvoice } = useInvoiceExport(invoice);
  const [lang, setLang] = useState<InvoiceLang>("vi");
  const [langOpen, setLangOpen] = useState(false);

  const selected = LANG_OPTIONS.find((o) => o.value === lang)!;

  return (
    <div className="flex items-center gap-2 px-5 py-3 bg-gray-50/60 border border-gray-100 rounded-lg flex-wrap">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">
        Xuất hóa đơn:
      </span>

      {/* Language selector */}
      <div className="relative">
        <button
          onClick={() => setLangOpen((v) => !v)}
          disabled={!!exporting}
          className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-gray-700 border border-gray-300 bg-white rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>{selected.flag}</span>
          <span>{selected.label}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>

        {langOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-md shadow-md py-1 min-w-[130px]">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setLang(opt.value); setLangOpen(false); }}
                className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-orange-50 transition-colors ${
                  lang === opt.value ? "font-semibold text-orange-600" : "text-gray-700"
                }`}
              >
                <span>{opt.flag}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Export PDF */}
      <button
        onClick={() => exportToPDF(lang)}
        disabled={!!exporting}
        className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-red-600 border border-red-200 bg-white rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {exporting === "pdf" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileDown className="w-3.5 h-3.5" />
        )}
        {exporting === "pdf" ? "Đang xuất..." : "PDF"}
      </button>

      {/* Export Excel */}
      <button
        onClick={exportToExcel}
        disabled={!!exporting}
        className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-green-700 border border-green-200 bg-white rounded-md hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {exporting === "excel" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sheet className="w-3.5 h-3.5" />
        )}
        {exporting === "excel" ? "Đang xuất..." : "Excel"}
      </button>

      {/* Print */}
      <button
        onClick={() => printInvoice(lang)}
        disabled={!!exporting}
        className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-gray-600 border border-gray-200 bg-white rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Printer className="w-3.5 h-3.5" />
        In hóa đơn
      </button>
    </div>
  );
}
