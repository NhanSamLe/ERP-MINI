import { useState, ElementType } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import {
  ShoppingCart,
  ShoppingBag,
  Users,
  DollarSign,
  FileText,
  Package,
  UserCog,
  UserCheck,
  Handshake,
  ChevronRight,
  Building2,
  ClipboardList,
  BrainCircuit,
} from "lucide-react";

interface SubItem {
  name: string;
  path: string;
  allowedRoles?: string[];
}

interface MenuItem {
  name: string;
  icon: ElementType;
  path?: string;
  subItems?: SubItem[];
  allowedRoles?: string[];
}

const menuItems: MenuItem[] = [
  {
    name: "Bán hàng",
    icon: ShoppingCart,
    path: "/sales",
    allowedRoles: [
      "SALESMANAGER",
      "SALES",
      "BRANCH_MANAGER",
      "CHACC",
      "ACCOUNT",
      "WHSTAFF",
      "WHMANAGER",
    ],
    subItems: [
      {
        name: "Báo giá",
        path: "/sales/quotations",
        allowedRoles: ["SALES", "SALESMANAGER", "ADMIN"],
      },
      {
        name: "Đơn bán hàng",
        path: "/sales/orders",
        allowedRoles: ["SALES", "SALESMANAGER", "CEO", "WHSTAFF", "ACCOUNT"],
      },
      {
        name: "Trả hàng bán",
        path: "/sales/returns",
        allowedRoles: [
          "SALES",
          "SALESMANAGER",
          "BRANCH_MANAGER",
          "WHSTAFF",
          "WHMANAGER",
        ],
      },
      {
        name: "Ghi có & Hoàn tiền",
        path: "/sales/returns-accounting",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
      {
        name: "Hóa đơn bán",
        path: "/invoices",
        allowedRoles: ["ACCOUNT", "CHACC", "CEO"],
      },
      {
        name: "Phiếu thu",
        path: "/receipts",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
      {
        name: "Khách hàng",
        path: "/partners?type=customer",
        allowedRoles: ["SALES", "SALESMANAGER"],
      },
    ],
  },
  {
    name: "Mua hàng",
    icon: ShoppingBag,
    path: "/purchase",
    allowedRoles: [
      "PURCHASE",
      "PURCHASEMANAGER",
      "WHSTAFF",
      "ACCOUNT",
      "CHACC",
    ],
    subItems: [
      {
        name: "Đơn mua hàng",
        path: "/purchase/orders",
        allowedRoles: ["PURCHASE", "PURCHASEMANAGER", "ACCOUNT", "WHSTAFF"],
      },
      {
        name: "Hóa đơn mua",
        path: "/purchase/invoices",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
      {
        name: "Phiếu chi",
        path: "/purchase/payments",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
      {
        name: "Nhà cung cấp",
        path: "/purchase/vendors",
        allowedRoles: ["PURCHASE", "PURCHASEMANAGER"],
      },
      {
        name: "Yêu cầu báo giá",
        path: "/purchase/rfqs",
        allowedRoles: ["PURCHASE", "PURCHASEMANAGER"],
      },
      {
        name: "Bảng giá mua",
        path: "/purchase/price-lists",
        allowedRoles: ["PURCHASE", "PURCHASEMANAGER", "ACCOUNT"],
      },
      {
        name: "Yêu cầu trả hàng",
        path: "/purchase/return-authorizations",
        allowedRoles: ["PURCHASE", "PURCHASEMANAGER", "ACCOUNT", "CHACC"],
      },
      {
        name: "Trả hàng mua",
        path: "/purchase/returns",
        allowedRoles: ["PURCHASE", "PURCHASEMANAGER", "ACCOUNT", "CHACC"],
      },
      {
        name: "Giấy báo nợ",
        path: "/purchase/debit-notes",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
      {
        name: "Hoàn tiền NCC",
        path: "/purchase/vendor-refunds",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
      {
        name: "Scan hóa đơn (OCR)",
        path: "/purchase/document-intelligence",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
      {
        name: "Lịch sử OCR",
        path: "/purchase/document-intelligence/history",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
    ],
  },
  {
    name: "Kho hàng",
    icon: Package,
    path: "/inventory",
    allowedRoles: ["WHMANAGER", "WHSTAFF", "ADMIN"],
    subItems: [
      {
        name: "Sản phẩm",
        path: "/inventory/products",
        allowedRoles: ["WHMANAGER", "WHSTAFF", "ADMIN"],
      },
      { name: "Kho", path: "/inventory/warehouses", allowedRoles: ["ADMIN"] },
      {
        name: "Vị trí kho",
        path: "/inventory/locations",
        allowedRoles: ["ADMIN", "WHMANAGER", "WHSTAFF"],
      },
      {
        name: "Lô hàng",
        path: "/inventory/lots",
        allowedRoles: ["ADMIN", "WHMANAGER", "WHSTAFF", "PURCHASE"],
      },
      {
        name: "Danh mục",
        path: "/inventory/categories",
        allowedRoles: ["WHMANAGER", "ADMIN", "WHSTAFF"],
      },
      {
        name: "Tồn kho",
        path: "/inventory/stock",
        allowedRoles: ["WHMANAGER", "WHSTAFF"],
      },
      {
        name: "Phiếu kho",
        path: "/inventory/stock_move",
        allowedRoles: ["WHMANAGER", "WHSTAFF"],
      },
      {
        name: "Hàng bán trả về",
        path: "/inventory/sales-returns",
        allowedRoles: ["WHMANAGER", "WHSTAFF"],
      },
      {
        name: "Kiểm kê kho",
        path: "/inventory/physical-inventories",
        allowedRoles: ["ADMIN", "WHMANAGER", "WHSTAFF"],
      },
      {
        name: "Báo cáo kho",
        path: "/inventory/reports",
        allowedRoles: ["ADMIN", "WHMANAGER", "WHSTAFF"],
      },
    ],
  },
  {
    name: "CRM",
    icon: Users,
    path: "/crm",
    allowedRoles: ["SALES", "SALESMANAGER", "ADMIN"],
    subItems: [
      {
        name: "Khách hàng tiềm năng",
        path: "/crm/leads",
        allowedRoles: ["SALES", "SALESMANAGER", "ADMIN"],
      },
      {
        name: "Cơ hội kinh doanh",
        path: "/crm/opportunities",
        allowedRoles: ["SALES", "SALESMANAGER", "ADMIN"],
      },
      {
        name: "Công việc",
        path: "/crm/activities/tasks",
        allowedRoles: ["SALES", "SALESMANAGER"],
      },
      {
        name: "Cuộc gọi",
        path: "/crm/activities/calls",
        allowedRoles: ["SALES", "SALESMANAGER"],
      },
      {
        name: "Email",
        path: "/crm/activities/emails",
        allowedRoles: ["SALES", "SALESMANAGER"],
      },
      {
        name: "Cuộc họp",
        path: "/crm/activities/meetings",
        allowedRoles: ["SALES", "SALESMANAGER"],
      },
      {
        name: "Nguồn khách hàng",
        path: "/crm/settings/lead-sources",
        allowedRoles: ["SALESMANAGER", "ADMIN"],
      },
      {
        name: "Quy trình bán hàng",
        path: "/crm/settings/pipelines",
        allowedRoles: ["SALESMANAGER", "ADMIN"],
      },
      {
        name: "Quy tắc chấm điểm",
        path: "/crm/settings/scoring-rules",
        allowedRoles: ["SALESMANAGER", "ADMIN"],
      },
    ],
  },
  {
    name: "Tài chính",
    icon: DollarSign,
    path: "/finance",
    allowedRoles: ["ACCOUNT", "CHACC", "CEO"],
    subItems: [
      {
        name: "Hệ thống tài khoản",
        path: "/finance/accounts",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
      {
        name: "Bút toán",
        path: "/finance/journals",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
      {
        name: "Thiết lập định khoản",
        path: "/finance/mappings",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
      {
        name: "Báo cáo tài chính",
        path: "/finance/reports",
        allowedRoles: ["ACCOUNT", "CHACC", "CEO", "ADMIN"],
      },
    ],
  },
  {
    name: "Nhân sự & Lương",
    icon: UserCheck,
    path: "/hrm",
    allowedRoles: [
      "HRMANAGER",
      "HR_STAFF",
      "CEO",
      "BRANCH_MANAGER",
      "ACCOUNT",
      "CHACC",
      "SALES",
      "WHSTAFF",
      "PURCHASE",
      "ADMIN",
    ],
    subItems: [
      {
        name: "Phòng ban",
        path: "/hrm/department",
        allowedRoles: ["HRMANAGER", "HR_STAFF"],
      },
      {
        name: "Chức vụ",
        path: "/hrm/position",
        allowedRoles: ["HRMANAGER", "HR_STAFF"],
      },
      {
        name: "Sơ đồ tổ chức",
        path: "",
        allowedRoles: ["CEO", "BRANCH_MANAGER"],
      },
      {
        name: "Nhân viên",
        path: "/hrm/employees",
        allowedRoles: ["HRMANAGER", "HR_STAFF"],
      },
      {
        name: "Chấm công",
        path: "/hrm/attendance",
      },
      {
        name: "Đơn xin nghỉ phép",
        path: "/hrm/leave-requests",
      },
      {
        name: "Kỳ lương",
        path: "/hrm/payroll",
        allowedRoles: ["HRMANAGER", "HR_STAFF"],
      },
      {
        name: "Khoản lương",
        path: "/hrm/payroll-items",
        allowedRoles: ["HRMANAGER", "HR_STAFF", "ACCOUNT", "CHACC"],
      },
      {
        name: "Tính lương",
        path: "/hrm/payroll-runs",
        allowedRoles: ["HRMANAGER", "HR_STAFF", "ACCOUNT", "CHACC", "CEO", "ADMIN"],
      },
      {
        name: "Payroll Mapping",
        path: "/hrm/payroll-mappings",
        allowedRoles: ["HRMANAGER", "HR_STAFF", "ACCOUNT", "CHACC", "CEO", "ADMIN"],
      },
      {
        name: "Cost Centers",
        path: "/hrm/cost-centers",
        allowedRoles: ["HRMANAGER", "HR_STAFF", "ACCOUNT", "CHACC", "CEO", "ADMIN"],
      },
      {
        name: "Cấu hình lương",
        path: "/hrm/payroll-configs",
        allowedRoles: ["HRMANAGER", "HR_STAFF", "CHACC", "ADMIN"],
      },
    ],
  },
  {
    name: "Báo cáo",
    icon: FileText,
    path: "/reports",
    allowedRoles: ["CEO", "BRANCH_MANAGER"],
    subItems: [
      {
        name: "Báo cáo bán hàng",
        path: "/reports/sales",
        allowedRoles: ["CEO", "BRANCH_MANAGER"],
      },
      {
        name: "Báo cáo mua hàng",
        path: "/reports/purchase",
        allowedRoles: ["CEO", "BRANCH_MANAGER"],
      },
      {
        name: "Báo cáo kho",
        path: "/reports/inventory",
        allowedRoles: ["CEO", "BRANCH_MANAGER"],
      },
      {
        name: "Báo cáo tài chính",
        path: "/reports/financial",
        allowedRoles: ["CEO", "BRANCH_MANAGER"],
      },
    ],
  },
  {
    name: "Đối tác",
    icon: Handshake,
    path: "/partners",
    allowedRoles: ["PURCHASE", "ADMIN", "PURCHASEMANAGER"],
    subItems: [
      { name: "Tất cả đối tác", path: "/partners", allowedRoles: ["ADMIN"] },
      {
        name: "Khách hàng",
        path: "/partners?type=customer",
        allowedRoles: ["ADMIN"],
      },
      {
        name: "Nhà cung cấp",
        path: "/partners?type=supplier",
        allowedRoles: ["PURCHASE", "ADMIN", "PURCHASEMANAGER"],
      },
    ],
  },
  {
    name: "Chi nhánh",
    icon: Building2,
    path: "/company/branches",
    allowedRoles: ["CEO", "ADMIN"],
    subItems: [
      {
        name: "Quản lý chi nhánh",
        path: "/company/branches",
        allowedRoles: ["ADMIN", "CEO"],
      },
      {
        name: "Tạo chi nhánh",
        path: "/company/branches/create",
        allowedRoles: ["CEO", "ADMIN"],
      },
    ],
  },
  {
    name: "AI Narrative",
    icon: BrainCircuit,
    path: "/ai-narrative",
    allowedRoles: ["CEO", "ADMIN", "CHACC", "ACCOUNT", "BRANCH_MANAGER"],
  },
  {
    name: "AI Blog",
    icon: FileText,
    path: "/blog",
    allowedRoles: ["CEO", "ADMIN", "SALESMANAGER", "SALES"],
  },
  {
    name: "Quản trị",
    icon: UserCog,
    allowedRoles: ["ADMIN"],
    subItems: [
      { name: "Người dùng", path: "/admin/users", allowedRoles: ["ADMIN"] },
      {
        name: "Tiền tệ",
        path: "/master-data/currencies",
        allowedRoles: ["ADMIN"],
      },
      {
        name: "Tỷ giá",
        path: "/master-data/exchange-rates",
        allowedRoles: ["ADMIN"],
      },
      {
        name: "Đơn vị tính",
        path: "/master-data/uoms",
        allowedRoles: ["ADMIN"],
      },
      {
        name: "Quy đổi đơn vị",
        path: "/master-data/uom-conversions",
        allowedRoles: ["ADMIN"],
      },
      {
        name: "Thuế suất",
        path: "/master-data/taxes",
        allowedRoles: ["ADMIN"],
      },
    ],
  },
];

export default function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const { user } = useSelector((s: RootState) => s.auth);
  const branches = useSelector((s: RootState) => s.branch.branches || []);
  const defaultBranchId = branches[0]?.id;

  const canAccess = (roles?: string[]) =>
    !roles || roles.includes(user?.role.code ?? "");

  const toggleExpand = (name: string) =>
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name],
    );

  const isModuleActive = (item: MenuItem) => {
    if (item.path && location.pathname.startsWith(item.path)) return true;
    return (
      item.subItems?.some(
        (sub) => sub.path && location.pathname.startsWith(sub.path),
      ) ?? false
    );
  };

  const isSubItemActive = (path: string) => path && location.pathname === path;

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Sidebar header label */}
      <div className="px-4 pt-3 pb-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Điều hướng
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto pb-4 space-y-0.5 px-2">
        {menuItems
          .filter((item) => canAccess(item.allowedRoles))
          .map((item) => {
            const filteredSubs = item.subItems?.filter((sub) =>
              canAccess(sub.allowedRoles),
            );
            const moduleActive = isModuleActive(item);
            const expanded = expandedItems.includes(item.name);

            return (
              <div key={item.name}>
                {/* Module row */}
                <div
                  onClick={() =>
                    filteredSubs?.length && toggleExpand(item.name)
                  }
                  className={[
                    "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer",
                    "text-sm font-medium transition-colors duration-100 select-none",
                    moduleActive
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  ].join(" ")}
                >
                  {item.path ? (
                    <Link
                      to={item.path}
                      className="flex items-center gap-2.5 flex-1 min-w-0"
                    >
                      <item.icon
                        className={`w-4 h-4 shrink-0 ${moduleActive ? "text-orange-500" : "text-gray-400"}`}
                      />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <item.icon
                        className={`w-4 h-4 shrink-0 ${moduleActive ? "text-orange-500" : "text-gray-400"}`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                  )}

                  {filteredSubs && filteredSubs.length > 0 && (
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
                    />
                  )}
                </div>

                {/* Sub-items */}
                {filteredSubs && expanded && (
                  <div className="mt-0.5 ml-3 pl-4 border-l border-gray-100 space-y-0.5">
                    {filteredSubs.map((sub) => {
                      const targetPath =
                        sub.name === "Chart"
                          ? defaultBranchId
                            ? `/hrm/organization/${defaultBranchId}`
                            : "/company/branches"
                          : sub.path;

                      const active = isSubItemActive(targetPath);

                      return (
                        <Link
                          key={sub.name}
                          to={targetPath}
                          className={[
                            "block px-3 py-1.5 rounded-md text-sm transition-colors duration-100",
                            active
                              ? "bg-orange-50 text-orange-600 font-semibold"
                              : "text-gray-500 hover:text-gray-800 hover:bg-gray-50",
                          ].join(" ")}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 font-medium">ERP UTE · v1.0</p>
      </div>
    </aside>
  );
}
