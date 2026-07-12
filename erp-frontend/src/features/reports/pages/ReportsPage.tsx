import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, TrendingUp, BarChart3, Users, Briefcase, Calendar, Download, Eye, DollarSign } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { toast } from "react-toastify";

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  viewPath?: string;
  onExport?: () => Promise<void> | void;
}

function ReportCard({ title, description, icon, viewPath, onExport }: ReportCardProps) {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!onExport) return;
    setExporting(true);
    try {
      await onExport();
    } catch {
      toast.error("Xuất báo cáo thất bại.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-250 hover:shadow-md transition-all flex flex-col justify-between min-h-[160px]">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            {icon}
          </span>
          <h3 className="font-semibold text-sm text-gray-900">{title}</h3>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">{description}</p>
      </div>

      <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
        {viewPath && (
          <Button variant="outline" size="sm" onClick={() => navigate(viewPath)} leftIcon={<Eye className="w-3.5 h-3.5" />}>
            Xem báo cáo
          </Button>
        )}
        {onExport && (
          <Button variant="primary" size="sm" onClick={handleExport} loading={exporting} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Xuất Excel
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const simulateExport = (reportName: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast.success(`Đã xuất báo cáo ${reportName} thành công 📥`);
        resolve();
      }, 1500);
    });
  };

  return (
    <div className="page-container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-500" />
          Trung tâm báo cáo tổng hợp (Reports Hub)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Truy cập báo cáo phân tích hoặc xuất dữ liệu thống kê của các phân hệ CRM, Sales, Purchases, Kho vận và HRM.
        </p>
      </div>

      {/* Grid of Modules */}
      <div className="space-y-8">
        {/* Module 1: CRM & Sales */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            CRM & Kinh doanh (Sales)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ReportCard
              title="Báo cáo cơ hội CRM"
              description="Thống kê các cơ hội bán hàng, tỷ lệ chuyển đổi từ lead sang cơ hội thắng và lý do thất bại."
              icon={<TrendingUp className="w-4 h-4" />}
              viewPath="/crm/dashboard"
              onExport={() => simulateExport("Thống kê cơ hội CRM")}
            />
            <ReportCard
              title="Báo cáo doanh số bán hàng"
              description="Doanh thu bán hàng theo chi nhánh, đơn hàng đã duyệt và doanh số của từng nhân viên."
              icon={<DollarSign className="w-4 h-4" />}
              viewPath="/sales/dashboard"
              onExport={() => simulateExport("Doanh số bán hàng")}
            />
            <ReportCard
              title="Thống kê báo giá & Đơn hàng"
              description="Tỷ lệ chấp thuận báo giá, công nợ hoá đơn phải thu và tỷ lệ hoàn trả của khách hàng."
              icon={<BarChart3 className="w-4 h-4" />}
              onExport={() => simulateExport("Thống kê báo giá & Đơn hàng")}
            />
          </div>
        </div>

        {/* Module 2: Kho vận & Mua hàng */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-orange-500" />
            Kho vận & Mua hàng (Inventory & Purchase)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ReportCard
              title="Số dư tồn kho chi tiết"
              description="Báo cáo số dư tồn kho, giá trị tồn kho của sản phẩm tại các chi nhánh Hồ Chí Minh và Hà Nội."
              icon={<BarChart3 className="w-4 h-4" />}
              viewPath="/inventory/reports"
              onExport={() => simulateExport("Số dư tồn kho chi tiết")}
            />
            <ReportCard
              title="Nhật ký dịch chuyển kho"
              description="Lịch sử các phiếu nhập kho mua hàng, xuất kho bán hàng, chuyển kho và thanh lý phế phẩm."
              icon={<FileText className="w-4 h-4" />}
              onExport={() => simulateExport("Nhật ký dịch chuyển kho")}
            />
            <ReportCard
              title="Báo cáo mua hàng & Công nợ AP"
              description="Thống kê đơn mua hàng PO từ nhà cung cấp và công nợ phải trả theo kỳ kế toán."
              icon={<DollarSign className="w-4 h-4" />}
              onExport={() => simulateExport("Mua hàng & Công nợ AP")}
            />
          </div>
        </div>

        {/* Module 3: Nhân sự & Kế toán */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" />
            Nhân sự & Tài chính (HRM & Ledger)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ReportCard
              title="Thống kê chuyên cần & Chấm công"
              description="Báo cáo số ngày công làm việc, số ngày nghỉ phép, đi muộn về sớm của nhân viên toàn công ty."
              icon={<Calendar className="w-4 h-4" />}
              onExport={() => simulateExport("Chuyên cần & Chấm công")}
            />
            <ReportCard
              title="Báo cáo chi phí lương hàng tháng"
              description="Tổng hợp quỹ lương thực nhận, bảo hiểm và thuế cá nhân theo từng kỳ lương tháng đã chốt."
              icon={<Users className="w-4 h-4" />}
              onExport={() => simulateExport("Chi phí lương hàng tháng")}
            />
            <ReportCard
              title="Tóm tắt bút toán sổ cái (GL)"
              description="Báo cáo tóm tắt đối ứng nợ/có và kết quả hoạt động kinh doanh sơ bộ từ sổ nhật ký tài chính."
              icon={<FileText className="w-4 h-4" />}
              onExport={() => simulateExport("Tóm tắt bút toán sổ cái (GL)")}
            />
          </div>
        </div>

        {/* Module 4: Ban giám đốc (CEO Only) */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-500" />
            Quản trị & Điều hành (CEO Management)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ReportCard
              title="Phân tích hiệu quả Chi nhánh"
              description="Báo cáo đối sánh kết quả kinh doanh: Doanh thu bán hàng, Chi phí mua hàng, Quỹ lương thực tế và Số lượng nhân sự theo từng chi nhánh."
              icon={<Building2 className="w-4 h-4" />}
              viewPath="/reports/branch-analysis"
              onExport={() => simulateExport("Phân tích hiệu quả Chi nhánh")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
