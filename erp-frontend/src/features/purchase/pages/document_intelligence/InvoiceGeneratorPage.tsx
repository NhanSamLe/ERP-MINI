// InvoiceGeneratorPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FileText,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  Settings,
  Eye,
  ArrowLeft,
  Loader2,
  FileCheck,
} from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { uploadDocumentThunk, resetDocumentState } from "../../store/documentIntelligence";

// Định nghĩa cấu trúc kịch bản mẫu
interface SandboxItem {
  name: string;
  unit: string;
  qty: number;
  price: number;
  tax: number;
  discount?: number;
}

interface SandboxScenario {
  code: string;
  name: string;
  description: string;
  vendor: string;
  taxCode: string;
  address: string;
  phone?: string;
  email?: string;
  buyer: string;
  buyerTaxCode: string;
  buyerAddress: string;
  poNo: string;
  invNo: string;
  date: string;
  series: string;
  templateNo: string;
  items: SandboxItem[];
  isBlurry?: boolean;
  lowQualityText?: boolean;
  watermarkText?: string;
  notes?: string;
}

// 12/13 Kịch bản chi tiết từ ocr-invoice-scenarios.html
const PRESETS: SandboxScenario[] = [
  {
    code: "TC-01",
    name: "Lavie Happy Path (Có PO)",
    description: "Hóa đơn nước Lavie, khớp 100% với đơn đặt hàng PO-2024-0123. AI tự động phê duyệt.",
    vendor: "Công Ty TNHH Nước Giải Khát Lavie Việt Nam",
    taxCode: "0301234567",
    address: "123 Đường Nguyễn Văn Linh, Q.7, TP.HCM",
    phone: "028-3456-7890",
    email: "billing@lavie.com.vn",
    buyer: "Công Ty Cổ Phần Thương Mại XYZ",
    buyerTaxCode: "0987654321",
    buyerAddress: "456 Lê Văn Việt, Q.9, TP.HCM",
    poNo: "PO-2024-0123",
    invNo: "HD-2024-0055",
    date: "15/03/2024",
    series: "1C24TAA",
    templateNo: "01GTKT0/001",
    items: [
      { name: "Nước suối Lavie 500ml", unit: "Thùng", qty: 10, price: 168000, tax: 10 },
      { name: "Nước suối Lavie 1.5L", unit: "Thùng", qty: 5, price: 210000, tax: 10 },
      { name: "Nước khoáng Lavie Sparkling 330ml", unit: "Thùng", qty: 8, price: 195000, tax: 10 }
    ],
    notes: "Hóa đơn liên kết với Đơn Mua Hàng PO-2024-0123. Đã giao đầy đủ hàng."
  },
  {
    code: "TC-02",
    name: "Giao Hàng Từng Phần (Partial Delivery)",
    description: "PO đặt 100 nhưng chỉ lập hóa đơn thanh toán cho 40 chai đã bàn giao lần 2.",
    vendor: "Công Ty TNHH Nước Giải Khát Lavie Việt Nam",
    taxCode: "0301234567",
    address: "123 Đường Nguyễn Văn Linh, Q.7, TP.HCM",
    buyer: "Công Ty Cổ Phần Thương Mại XYZ",
    buyerTaxCode: "0987654321",
    buyerAddress: "456 Lê Văn Việt, Q.9, TP.HCM",
    poNo: "PO-2024-0123",
    invNo: "HD-2024-0056",
    date: "18/03/2024",
    series: "1C24TAA",
    templateNo: "01GTKT0/001",
    items: [
      { name: "Nước suối Lavie 500ml", unit: "Thùng", qty: 4, price: 168000, tax: 10 }
    ],
    notes: "Thanh toán đợt 2 cho lượng hàng giao bổ sung."
  },
  {
    code: "TC-03",
    name: "Hóa đơn Dịch vụ (Không PO)",
    description: "Hóa đơn tư vấn của XYZ Consulting. Bỏ qua đối chiếu 3 bên, cần kế toán duyệt tay.",
    vendor: "Công Ty TNHH Tư Vấn XYZ Consulting",
    taxCode: "0312345678",
    address: "789 Đinh Tiên Hoàng, Q.Bình Thạnh, TP.HCM",
    phone: "028-1234-5678",
    email: "invoice@xyzconsulting.vn",
    buyer: "Công Ty Cổ Phần Thương Mại XYZ",
    buyerTaxCode: "0987654321",
    buyerAddress: "456 Lê Văn Việt, Q.9, TP.HCM",
    poNo: "",
    invNo: "SVC-2024-0012",
    date: "20/03/2024",
    series: "2C24TBB",
    templateNo: "02GTKT0/002",
    items: [
      { name: "Tư vấn tái cơ cấu quy trình quản lý dự án", unit: "Ngày công", qty: 20, price: 2000000, tax: 10 },
      { name: "Đào tạo nhân sự quản lý cấp trung", unit: "Buổi", qty: 2, price: 5000000, tax: 10 }
    ],
    notes: "Hóa đơn dịch vụ tư vấn theo hợp đồng quản lý số HĐ-TV-2024-003. Không áp dụng PO."
  },
  {
    code: "TC-04",
    name: "Confidence Thấp (Nhiễu chữ)",
    description: "Chữ bị cố tình làm mờ và sai chính tả một vài ký tự để test cảnh báo review của AI.",
    vendor: "Công Ty TN?? ??? Trading Vi?t Nam",
    taxCode: "03?????789",
    address: "12? Nguyễn Văn Linh, Q.7, TP.HCM",
    buyer: "Công Ty Cổ Phần Thương Mại XYZ",
    buyerTaxCode: "0987654321",
    buyerAddress: "456 Lê Văn Việt, Q.9, TP.HCM",
    poNo: "",
    invNo: "HD-2024-????",
    date: "22/03/2024",
    series: "1C24TCC",
    templateNo: "01GTKT0/001",
    items: [
      { name: "Thiết bị lọc nước RO thông minh", unit: "Cái", qty: 2, price: 4500000, tax: 10 }
    ],
    lowQualityText: true,
    isBlurry: true
  },
  {
    code: "TC-05",
    name: "Vendor không khớp (Tên viết tắt)",
    description: "Tên nhà cung cấp bị ghi tắt 'Cty TNHH Nước Giải Khát Lavie' để AI cảnh báo lỗi đối tác.",
    vendor: "Cty TNHH Nước Giải Khát Lavie",
    taxCode: "0301234567",
    address: "123 Nguyễn Văn Linh, Q.7, TP.HCM",
    buyer: "Công Ty Cổ Phần Thương Mại XYZ",
    buyerTaxCode: "0987654321",
    buyerAddress: "456 Lê Văn Việt, Q.9, TP.HCM",
    poNo: "PO-2024-0123",
    invNo: "HD-2024-0088",
    date: "15/03/2024",
    series: "1C24TAA",
    templateNo: "01GTKT0/001",
    items: [
      { name: "Nước suối Lavie 500ml", unit: "Thùng", qty: 10, price: 168000, tax: 10 }
    ]
  },
  {
    code: "TC-06",
    name: "Product không khớp (Sai SKU/Tên viết tắt)",
    description: "Tên sản phẩm ghi tắt 'Nước suối L.V 500ml' thay vì tên chuẩn để kiểm thử đối chiếu mặt hàng.",
    vendor: "Công Ty TNHH Nước Giải Khát Lavie Việt Nam",
    taxCode: "0301234567",
    address: "123 Nguyễn Văn Linh, Q.7, TP.HCM",
    buyer: "Công Ty Cổ Phần Thương Mại XYZ",
    buyerTaxCode: "0987654321",
    buyerAddress: "456 Lê Văn Việt, Q.9, TP.HCM",
    poNo: "PO-2024-0123",
    invNo: "HD-2024-0099",
    date: "15/03/2024",
    series: "1C24TAA",
    templateNo: "01GTKT0/001",
    items: [
      { name: "Nước suối L.V 500ml", unit: "Thùng", qty: 10, price: 168000, tax: 10 }
    ]
  },
  {
    code: "TC-07",
    name: "Hóa đơn Trùng lặp",
    description: "Tạo trùng mã số HD-2024-0055 để hệ thống kiểm tra và phát hiện cảnh báo trùng lặp.",
    vendor: "Công Ty TNHH Nước Giải Khát Lavie Việt Nam",
    taxCode: "0301234567",
    address: "123 Đường Nguyễn Văn Linh, Q.7, TP.HCM",
    buyer: "Công Ty Cổ Phần Thương Mại XYZ",
    buyerTaxCode: "0987654321",
    buyerAddress: "456 Lê Văn Việt, Q.9, TP.HCM",
    poNo: "PO-2024-0123",
    invNo: "HD-2024-0055", // Trùng số của TC-01
    date: "15/03/2024",
    series: "1C24TAA",
    templateNo: "01GTKT0/001",
    items: [
      { name: "Nước suối Lavie 500ml", unit: "Thùng", qty: 10, price: 168000, tax: 10 }
    ]
  },
  {
    code: "TC-08",
    name: "Lệch Số Lượng (Qty Mismatch)",
    description: "Số lượng trên hóa đơn (15 thùng) lệch nhiều so với PO (chỉ đặt 10 thùng).",
    vendor: "Công Ty TNHH Nước Giải Khát Lavie Việt Nam",
    taxCode: "0301234567",
    address: "123 Đường Nguyễn Văn Linh, Q.7, TP.HCM",
    buyer: "Công Ty Cổ Phần Thương Mại XYZ",
    buyerTaxCode: "0987654321",
    buyerAddress: "456 Lê Văn Việt, Q.9, TP.HCM",
    poNo: "PO-2024-0123",
    invNo: "HD-2024-0077",
    date: "15/03/2024",
    series: "1C24TAA",
    templateNo: "01GTKT0/001",
    items: [
      { name: "Nước suối Lavie 500ml", unit: "Thùng", qty: 15, price: 168000, tax: 10 } // PO chỉ đặt 10
    ]
  },
  {
    code: "TC-09",
    name: "Lệch Đơn Giá (Price Mismatch)",
    description: "Đơn giá trên hóa đơn tăng lên 180,000đ trong khi PO cam kết là 168,000đ.",
    vendor: "Công Ty TNHH Nước Giải Khát Lavie Việt Nam",
    taxCode: "0301234567",
    address: "123 Đường Nguyễn Văn Linh, Q.7, TP.HCM",
    buyer: "Công Ty Cổ Phần Thương Mại XYZ",
    buyerTaxCode: "0987654321",
    buyerAddress: "456 Lê Văn Việt, Q.9, TP.HCM",
    poNo: "PO-2024-0123",
    invNo: "HD-2024-0078",
    date: "15/03/2024",
    series: "1C24TAA",
    templateNo: "01GTKT0/001",
    items: [
      { name: "Nước suối Lavie 500ml", unit: "Thùng", qty: 10, price: 180000, tax: 10 } // PO giá là 168k
    ]
  },
  {
    code: "TC-10",
    name: "Math Mismatch (Sai lệch số học)",
    description: "Tổng tiền hàng cố tình tính sai lệch so với tổng các dòng hàng để test kiểm tra số học.",
    vendor: "Công Ty TNHH Nước Giải Khát Lavie Việt Nam",
    taxCode: "0301234567",
    address: "123 Đường Nguyễn Văn Linh, Q.7, TP.HCM",
    buyer: "Công Ty Cổ Phần Thương Mại XYZ",
    buyerTaxCode: "0987654321",
    buyerAddress: "456 Lê Văn Việt, Q.9, TP.HCM",
    poNo: "PO-2024-0123",
    invNo: "HD-2024-0092",
    date: "15/03/2024",
    series: "1C24TAA",
    templateNo: "01GTKT0/001",
    items: [
      { name: "Nước suối Lavie 500ml", unit: "Thùng", qty: 2, price: 168000, tax: 10 } // Tổng là 336k, thuế 33.6k, tổng 369.6k
    ],
    notes: "Lập sai tổng tiền thanh toán để thử thách hệ thống."
  },
  {
    code: "TC-11",
    name: "Thiếu thông tin người mua (Buyer Info Missing)",
    description: "Thiếu hoàn toàn MST hoặc tên Công ty người mua để test kiểm tra tính đầy đủ pháp lý.",
    vendor: "Công Ty TNHH Nước Giải Khát Lavie Việt Nam",
    taxCode: "0301234567",
    address: "123 Đường Nguyễn Văn Linh, Q.7, TP.HCM",
    buyer: "", // Thiếu tên
    buyerTaxCode: "", // Thiếu MST
    buyerAddress: "",
    poNo: "",
    invNo: "HD-2024-0105",
    date: "15/03/2024",
    series: "1C24TAA",
    templateNo: "01GTKT0/001",
    items: [
      { name: "Nước suối Lavie 500ml", unit: "Thùng", qty: 5, price: 168000, tax: 10 }
    ]
  },
  {
    code: "TC-12",
    name: "Confidence Cực Thấp (Hóa đơn mờ)",
    description: "Hóa đơn áp dụng bộ lọc mờ đậm và đóng dấu WATERMARK 'BẢN MỜ' để test khả năng OCR.",
    vendor: "Công Ty TNHH Nước Giải Khát Lavie Việt Nam",
    taxCode: "0301234567",
    address: "123 Đường Nguyễn Văn Linh, Q.7, TP.HCM",
    buyer: "Công Ty Cổ Phần Thương Mại XYZ",
    buyerTaxCode: "0987654321",
    buyerAddress: "456 Lê Văn Việt, Q.9, TP.HCM",
    poNo: "PO-2024-0123",
    invNo: "HD-2024-0055",
    date: "15/03/2024",
    series: "1C24TAA",
    templateNo: "01GTKT0/001",
    items: [
      { name: "Nước suối Lavie 500ml", unit: "Thùng", qty: 10, price: 168000, tax: 10 }
    ],
    isBlurry: true,
    watermarkText: "BẢN MỜ"
  }
];

export default function InvoiceGeneratorPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const [selectedPresetCode, setSelectedPresetCode] = useState<string>("TC-01");
  const [invoiceData, setInvoiceData] = useState<SandboxScenario>({ ...PRESETS[0] });
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Load preset data when dropdown changes
  const handlePresetChange = (code: string) => {
    setSelectedPresetCode(code);
    const preset = PRESETS.find((p) => p.code === code);
    if (preset) {
      setInvoiceData(JSON.parse(JSON.stringify(preset)));
    }
  };

  // Cập nhật giá trị trường dữ liệu text đơn giản
  const updateField = (key: keyof SandboxScenario, value: any) => {
    setInvoiceData((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // Cập nhật mặt hàng
  const updateItem = (idx: number, key: keyof SandboxItem, value: any) => {
    setInvoiceData((prev) => {
      const newItems = [...prev.items];
      newItems[idx] = {
        ...newItems[idx],
        [key]: value
      };
      return {
        ...prev,
        items: newItems
      };
    });
  };

  // Thêm mặt hàng
  const addItem = () => {
    setInvoiceData((prev) => ({
      ...prev,
      items: [...prev.items, { name: "Mặt hàng mới", unit: "Cái", qty: 1, price: 100000, tax: 10, discount: 0 }]
    }));
  };

  // Xóa mặt hàng
  const removeItem = (idx: number) => {
    if (invoiceData.items.length <= 1) {
      toast.warn("Hóa đơn phải có ít nhất 1 dòng mặt hàng");
      return;
    }
    setInvoiceData((prev) => {
      const newItems = prev.items.filter((_, i) => i !== idx);
      return {
        ...prev,
        items: newItems
      };
    });
  };

  // Tính toán số liệu
  const subtotal = invoiceData.items.reduce((s, it) => {
    const amountBeforeDiscount = (Number(it.qty) || 0) * (Number(it.price) || 0);
    const discountAmount = amountBeforeDiscount * ((Number(it.discount) || 0) / 100);
    return s + (amountBeforeDiscount - discountAmount);
  }, 0);

  const taxAmount = invoiceData.items.reduce((s, it) => {
    const amountBeforeDiscount = (Number(it.qty) || 0) * (Number(it.price) || 0);
    const discountAmount = amountBeforeDiscount * ((Number(it.discount) || 0) / 100);
    const lineTotal = amountBeforeDiscount - discountAmount;
    return s + (lineTotal * (Number(it.tax) || 0)) / 100;
  }, 0);

  const grandTotal = subtotal + taxAmount;

  // Thực hiện chụp ảnh HTML và tạo PDF
  const generatePDFBlob = async (): Promise<{ blob: Blob; filename: string }> => {
    const { jsPDF } = await import("jspdf");
    const html2canvas = (await import("html2canvas")).default;

    const element = printAreaRef.current;
    if (!element) {
      throw new Error("Không tìm thấy DOM in");
    }

    const canvas = await html2canvas(element, {
      scale: 1.5, // Giảm tỷ lệ canvas xuống 1.5 để nhẹ hơn mà vẫn cực kỳ sắc nét
      useCORS: true,
      logging: false,
    });

    // Chuyển sang định dạng JPEG với chất lượng nén 0.75 để tối ưu hóa dung lượng (giảm 95% kích thước so với PNG)
    const imgData = canvas.toDataURL("image/jpeg", 0.75);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight, undefined, "FAST");

    const pdfBlob = pdf.output("blob");
    return {
      blob: pdfBlob,
      filename: `sandbox_invoice_${invoiceData.code}.pdf`
    };
  };

  // Xuất file và Tải về máy
  const handleDownloadPDF = async () => {
    setExporting(true);
    try {
      const { blob, filename } = await generatePDFBlob();
      const fileSizeInBytes = blob.size;
      const sizeInMb = fileSizeInBytes / (1024 * 1024);
      
      if (sizeInMb > 10) {
        toast.error(`Lỗi: Kích thước file ${(sizeInMb).toFixed(1)} MB vượt quá giới hạn cho phép là 10 MB!`);
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(
        `Tải xuống hóa đơn PDF thành công! Kích thước: ${(fileSizeInBytes / 1024).toFixed(1)} KB / 10 MB`
      );
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi kết xuất PDF");
    } finally {
      setExporting(false);
    }
  };

  // Gửi trực tiếp lên luồng OCR thật của hệ thống
  const handleDirectOCR = async () => {
    setUploading(true);
    try {
      const { blob, filename } = await generatePDFBlob();
      const fileSizeInBytes = blob.size;
      const sizeInMb = fileSizeInBytes / (1024 * 1024);
      
      if (sizeInMb > 10) {
        toast.error(`Lỗi: Kích thước file ${(sizeInMb).toFixed(1)} MB vượt quá giới hạn cho phép là 10 MB!`);
        return;
      }

      const file = new File([blob], filename, { type: "application/pdf" });
      
      dispatch(resetDocumentState());
      
      await dispatch(uploadDocumentThunk(file)).unwrap();
      toast.success(
        `Đẩy lên OCR thành công! Kích thước: ${(fileSizeInBytes / 1024).toFixed(1)} KB / 10 MB`
      );
      navigate("/purchase/document-intelligence");
    } catch (err: any) {
      console.error(err);
      toast.error(err ?? "Lỗi khi upload OCR trực tiếp");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/purchase/document-intelligence")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sandbox Tạo & Xuất Hóa Đơn PDF</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Nhập liệu thông tin, dựng PDF hóa đơn A4 theo chuẩn hóa đơn đỏ để tải về máy hoặc chạy thử OCR.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={exporting || uploading}
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            ) : (
              <Download className="w-4 h-4 text-gray-600" />
            )}
            Tải PDF về máy
          </button>
          <button
            onClick={handleDirectOCR}
            disabled={exporting || uploading}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Upload className="w-4 h-4 text-white" />
            )}
            Đẩy Lên OCR Hệ Thống
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Form Editor */}
        <div className="w-1/2 p-6 overflow-y-auto space-y-6 border-r border-gray-200">
          {/* Preset Selector */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <label className="block text-sm font-bold text-gray-800">
              📁 Chọn Mẫu Kịch Bản (Preset)
            </label>
            <select
              value={selectedPresetCode}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white"
            >
              {PRESETS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 leading-relaxed italic bg-gray-50 p-2.5 rounded border">
              <strong>Mục tiêu:</strong> {invoiceData.description}
            </p>
          </div>

          {/* General Information */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-orange-500" />
              Thông Tin Chung Hóa Đơn
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Số hóa đơn</label>
                <input
                  type="text"
                  value={invoiceData.invNo}
                  onChange={(e) => updateField("invNo", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ngày lập hóa đơn</label>
                <input
                  type="text"
                  value={invoiceData.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  placeholder="DD/MM/YYYY"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kí hiệu mẫu số</label>
                <input
                  type="text"
                  value={invoiceData.series}
                  onChange={(e) => updateField("series", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mẫu số</label>
                <input
                  type="text"
                  value={invoiceData.templateNo}
                  onChange={(e) => updateField("templateNo", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-orange-500" />
              🏭 Thông Tin Người Bán (Nhà Cung Cấp)
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tên nhà cung cấp</label>
                <input
                  type="text"
                  value={invoiceData.vendor}
                  onChange={(e) => updateField("vendor", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Mã số thuế</label>
                  <input
                    type="text"
                    value={invoiceData.taxCode}
                    onChange={(e) => updateField("taxCode", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={invoiceData.phone || ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={invoiceData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Buyer Info */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-orange-500" />
              🏢 Thông Tin Người Mua
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tên đơn vị mua hàng</label>
                <input
                  type="text"
                  value={invoiceData.buyer}
                  onChange={(e) => updateField("buyer", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Mã số thuế người mua</label>
                  <input
                    type="text"
                    value={invoiceData.buyerTaxCode}
                    onChange={(e) => updateField("buyerTaxCode", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Mã số PO liên kết</label>
                  <input
                    type="text"
                    value={invoiceData.poNo}
                    onChange={(e) => updateField("poNo", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                    placeholder="Không có PO"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Địa chỉ người mua</label>
                <input
                  type="text"
                  value={invoiceData.buyerAddress}
                  onChange={(e) => updateField("buyerAddress", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-orange-500" />
                Danh Sách Mặt Hàng
              </h3>
              <button
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-bold transition-colors"
              >
                + Thêm dòng
              </button>
            </div>
            
            <div className="space-y-4">
              {invoiceData.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-50 border rounded-lg space-y-2 relative">
                  <button
                    onClick={() => removeItem(idx)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="pr-6">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Tên mặt hàng</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(idx, "name", e.target.value)}
                      className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">ĐVT</label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateItem(idx, "unit", e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">SL</label>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateItem(idx, "qty", Number(e.target.value))}
                        className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1 text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">Đơn giá</label>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(idx, "price", Number(e.target.value))}
                        className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1 text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">Thuế (%)</label>
                      <input
                        type="number"
                        value={item.tax}
                        onChange={(e) => updateItem(idx, "tax", Number(e.target.value))}
                        className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1 text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">CK (%)</label>
                      <input
                        type="number"
                        value={item.discount || 0}
                        onChange={(e) => updateItem(idx, "discount", Number(e.target.value))}
                        className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-orange-500 outline-none mt-1 text-right"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Options */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-orange-500" />
              Hiệu Ứng Giả Lập & Chất Lượng
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!invoiceData.isBlurry}
                  onChange={(e) => updateField("isBlurry", e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4"
                />
                <div className="text-xs text-gray-700">
                  <p className="font-semibold">Áp dụng hiệu ứng mờ (Blurry PDF)</p>
                  <p className="text-[10px] text-gray-400">Tạo độ mờ nét chữ trên file PDF để kiểm tra khả năng bóc tách OCR.</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!invoiceData.lowQualityText}
                  onChange={(e) => updateField("lowQualityText", e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4"
                />
                <div className="text-xs text-gray-700">
                  <p className="font-semibold">Chữ nhiễu (Dấu chấm hỏi/Sai chính tả)</p>
                  <p className="text-[10px] text-gray-400">Thêm ký tự lạ hoặc lỗi gõ chữ nhằm giả lập OCR bóc tách độ tin cậy thấp.</p>
                </div>
              </label>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Đóng dấu Watermark</label>
                <input
                  type="text"
                  value={invoiceData.watermarkText || ""}
                  onChange={(e) => updateField("watermarkText", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  placeholder="Ví dụ: BẢN NHÁP, BẢN MỜ..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live PDF Invoice Preview */}
        <div className="w-1/2 bg-gray-200 p-8 overflow-y-auto flex justify-center items-start shadow-inner">
          <div className="sticky top-4 space-y-4 flex flex-col items-center">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm text-xs font-bold text-gray-600">
              <Eye className="w-4 h-4 text-orange-500" />
              Xem Trước Bản In A4 Thực Tế (Live Preview)
            </div>

            {/* A4 Invoice Container */}
            <div
              ref={printAreaRef}
              style={{
                width: "210mm",
                minHeight: "297mm",
                backgroundColor: "white",
                padding: "20mm 15mm",
                fontFamily: "Times New Roman, serif",
                color: "#1a1a2e",
                boxSizing: "border-box",
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                filter: invoiceData.isBlurry ? "blur(1.2px)" : "none",
                position: "relative",
              }}
            >
              {/* Watermark */}
              {invoiceData.watermarkText && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%) rotate(-35deg)",
                    fontSize: "80px",
                    fontWeight: 900,
                    color: "rgba(0, 0, 0, 0.05)",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 0,
                    letterSpacing: "4px",
                  }}
                >
                  {invoiceData.watermarkText}
                </div>
              )}

              {/* Logo & Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", position: "relative", zIndex: 1 }}>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#000000", letterSpacing: "0.5px" }}>
                    HÓA ĐƠN ĐIỆN TỬ
                  </div>
                  <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>
                    Đơn vị phát hành: {invoiceData.vendor || "—"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <h1 style={{ fontSize: "18px", fontWeight: "bold", color: "#000000", textTransform: "uppercase", margin: 0 }}>
                    HÓA ĐƠN GTGT
                  </h1>
                  <div style={{ fontSize: "12px", color: "#475569", marginTop: "4px" }}>
                    Số: <strong>{invoiceData.invNo || "—"}</strong>
                  </div>
                  <div style={{ fontSize: "12px", color: "#475569" }}>
                    Ngày: <strong>{invoiceData.date || "—"}</strong>
                  </div>
                  <div style={{ fontSize: "11px", color: "#475569" }}>
                    Ký hiệu: {invoiceData.series || "—"} | Mẫu số: {invoiceData.templateNo || "—"}
                  </div>
                </div>
              </div>

              <div style={{ height: "1px", backgroundColor: "#000000", margin: "12px 0" }} />

              {/* Parties */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", margin: "16px 0", position: "relative", zIndex: 1 }}>
                <div style={{ border: "1px solid #cbd5e1", borderRadius: "4px", padding: "12px 14px" }}>
                  <div style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", color: "#475569", marginBottom: "6px", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                    ĐƠN VỊ BÁN HÀNG
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: "bold", color: "#000000", marginBottom: "4px" }}>
                    {invoiceData.vendor || "—"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#334155", lineHeight: "1.6" }}>
                    MST: <strong>{invoiceData.taxCode || "—"}</strong><br />
                    Địa chỉ: {invoiceData.address || "—"}<br />
                    Điện thoại: {invoiceData.phone || "—"}
                  </div>
                </div>

                <div style={{ border: "1px solid #cbd5e1", borderRadius: "4px", padding: "12px 14px" }}>
                  <div style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", color: "#475569", marginBottom: "6px", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                    ĐƠN VỊ MUA HÀNG
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: "bold", color: "#000000", marginBottom: "4px" }}>
                    {invoiceData.buyer || "—"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#334155", lineHeight: "1.6" }}>
                    MST: <strong>{invoiceData.buyerTaxCode || "—"}</strong><br />
                    Địa chỉ: {invoiceData.buyerAddress || "—"}<br />
                    PO liên kết: <strong>{invoiceData.poNo || "—"}</strong>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0", fontSize: "11px", position: "relative", zIndex: 1 }}>
                <thead>
                  <tr style={{ borderTop: "1px solid #000000", borderBottom: "1px solid #000000", backgroundColor: "#f8fafc" }}>
                    <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: "bold", color: "#000000" }}>STT</th>
                    <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: "bold", color: "#000000" }}>Tên hàng hóa, dịch vụ</th>
                    <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: "bold", color: "#000000" }}>ĐVT</th>
                    <th style={{ padding: "8px 6px", textAlign: "right", fontWeight: "bold", color: "#000000" }}>SL</th>
                    <th style={{ padding: "8px 6px", textAlign: "right", fontWeight: "bold", color: "#000000" }}>Đơn giá</th>
                    <th style={{ padding: "8px 6px", textAlign: "right", fontWeight: "bold", color: "#000000" }}>CK</th>
                    <th style={{ padding: "8px 6px", textAlign: "right", fontWeight: "bold", color: "#000000" }}>Thuế</th>
                    <th style={{ padding: "8px 6px", textAlign: "right", fontWeight: "bold", color: "#000000" }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((it, idx) => {
                    const amountBeforeDiscount = (Number(it.qty) || 0) * (Number(it.price) || 0);
                    const discountAmount = amountBeforeDiscount * ((Number(it.discount) || 0) / 100);
                    const lineTotal = amountBeforeDiscount - discountAmount;
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "8px 6px", color: "#000000" }}>{idx + 1}</td>
                        <td style={{ padding: "8px 6px", color: "#000000" }}>{it.name}</td>
                        <td style={{ padding: "8px 6px", color: "#000000" }}>{it.unit}</td>
                        <td style={{ padding: "8px 6px", textAlign: "right", color: "#000000" }}>{it.qty}</td>
                        <td style={{ padding: "8px 6px", textAlign: "right", color: "#000000" }}>{it.price.toLocaleString("vi-VN")}</td>
                        <td style={{ padding: "8px 6px", textAlign: "right", color: "#000000" }}>{it.discount ? `${it.discount}%` : ""}</td>
                        <td style={{ padding: "8px 6px", textAlign: "right", color: "#000000" }}>{it.tax}%</td>
                        <td style={{ padding: "8px 6px", textAlign: "right", color: "#000000" }}>{lineTotal.toLocaleString("vi-VN")}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "1px solid #000000" }}>
                    <td colSpan={7} style={{ padding: "6px 6px", textAlign: "right", color: "#475569" }}>Cộng tiền hàng:</td>
                    <td style={{ padding: "6px 6px", textAlign: "right", fontWeight: "bold", color: "#000000" }}>{subtotal.toLocaleString("vi-VN")}</td>
                  </tr>
                  <tr>
                    <td colSpan={7} style={{ padding: "6px 6px", textAlign: "right", color: "#475569" }}>Thuế GTGT:</td>
                    <td style={{ padding: "6px 6px", textAlign: "right", fontWeight: "bold", color: "#000000" }}>{taxAmount.toLocaleString("vi-VN")}</td>
                  </tr>
                  <tr style={{ borderTop: "1px solid #000000", borderBottom: "2px double #000000", fontWeight: "bold" }}>
                    <td colSpan={7} style={{ padding: "8px 6px", textAlign: "right", color: "#000000" }}>TỔNG CỘNG THANH TOÁN (VNĐ):</td>
                    <td style={{ padding: "8px 6px", textAlign: "right", color: "#000000" }}>{grandTotal.toLocaleString("vi-VN")}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Notes */}
              <div style={{ marginTop: "16px", padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: "4px", border: "1px solid #e2e8f0", position: "relative", zIndex: 1 }}>
                <p style={{ fontSize: "11px", color: "#475569", margin: 0, lineHeight: "1.6" }}>
                  <strong>Ghi chú:</strong> {invoiceData.notes || "Hàng hóa/Dịch vụ được bàn giao đầy đủ. Kịch bản chạy sandbox OCR ERP-Mini."}
                </p>
              </div>

              {/* Signatures */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "30px", position: "relative", zIndex: 1 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "#334155" }}>Người Mua Hàng</div>
                  <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>(Ký, ghi rõ họ tên)</div>
                  <div style={{ height: "45px", borderBottom: "1px dashed #cbd5e1", margin: "8px 0" }}></div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "#334155" }}>Người Bán Hàng</div>
                  <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>(Ký, đóng dấu, ghi rõ họ tên)</div>
                  <div style={{ height: "45px", borderBottom: "1px dashed #cbd5e1", margin: "8px 0" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
