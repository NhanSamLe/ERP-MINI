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
    name: "Sales",
    icon: ShoppingCart,
    path: "/sales",
    allowedRoles: ["SALESMANAGER", "SALES", "BRANCH_MANAGER", "CHACC", "ACCOUNT", "WHSTAFF", "WHMANAGER"],
    subItems: [
      { name: "Quotations", path: "/sales/quotations",      allowedRoles: ["SALES", "SALESMANAGER", "ADMIN"] },
      { name: "Orders",     path: "/sales/orders",          allowedRoles: ["SALES", "SALESMANAGER", "CEO", "WHSTAFF", "ACCOUNT"] },
      { name: "Returns",    path: "/sales/returns",         allowedRoles: ["SALES", "SALESMANAGER", "BRANCH_MANAGER", "WHSTAFF", "WHMANAGER", "ACCOUNT", "CHACC"] },
      { name: "Invoices",   path: "/invoices",              allowedRoles: ["ACCOUNT", "CHACC", "CEO"] },
      { name: "Receipts",   path: "/receipts",              allowedRoles: ["ACCOUNT", "CHACC"] },
      { name: "Customers",  path: "/partners?type=customer",allowedRoles: ["SALES", "SALESMANAGER"] },
    ],
  },
  {
    name: "Purchase",
    icon: ShoppingBag,
    path: "/purchase",
    allowedRoles: ["PURCHASE", "PURCHASEMANAGER", "WHSTAFF", "ACCOUNT", "CHACC"],
    subItems: [
      { name: "Purchase Orders", path: "/purchase/orders",   allowedRoles: ["PURCHASE", "PURCHASEMANAGER", "ACCOUNT", "WHSTAFF"] },
      { name: "Invoices",        path: "/purchase/invoices", allowedRoles: ["ACCOUNT", "CHACC"] },
      { name: "Payments",        path: "/purchase/payments", allowedRoles: ["ACCOUNT", "CHACC"] },
      { name: "Vendors",         path: "/purchase/vendors",  allowedRoles: ["PURCHASE", "PURCHASEMANAGER"] },
      { name: "RFQs",            path: "/purchase/rfqs",     allowedRoles: ["PURCHASE", "PURCHASEMANAGER"] },
      {
        name: "OCR Invoice",
        path: "/purchase/document-intelligence",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
      {
        name: "OCR History",
        path: "/purchase/document-intelligence/history",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
    ],
  },
  {
    name: "Inventory",
    icon: Package,
    path: "/inventory",
    allowedRoles: ["WHMANAGER", "WHSTAFF", "ADMIN"],
    subItems: [
      { name: "Products",    path: "/inventory/products",    allowedRoles: ["WHMANAGER", "WHSTAFF", "ADMIN"] },
      { name: "Warehouses",  path: "/inventory/warehouses",  allowedRoles: ["ADMIN"] },
      { name: "Locations",   path: "/inventory/locations",   allowedRoles: ["ADMIN", "WHMANAGER", "WHSTAFF"] },
      { name: "Lots",        path: "/inventory/lots",        allowedRoles: ["ADMIN", "WHMANAGER", "WHSTAFF", "PURCHASE"] },
      { name: "Category",    path: "/inventory/categories",  allowedRoles: ["WHMANAGER", "ADMIN", "WHSTAFF"] },
      { name: "Stock",       path: "/inventory/stock",       allowedRoles: ["WHMANAGER", "WHSTAFF"] },
      { name: "Stock Moves", path: "/inventory/stock_move",  allowedRoles: ["WHMANAGER", "WHSTAFF"] },
      { name: "Hàng bán trả về", path: "/inventory/sales-returns", allowedRoles: ["WHMANAGER", "WHSTAFF"] },
      {
        name: "Physical Inventory",
        path: "/inventory/physical-inventories",
        allowedRoles: ["ADMIN", "WHMANAGER", "WHSTAFF"],
      },
      {
        name: "Reports",
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
      { name: "Leads",              path: "/crm/leads",                   allowedRoles: ["SALES", "SALESMANAGER", "ADMIN"] },
      { name: "Opportunities",      path: "/crm/opportunities",           allowedRoles: ["SALES", "SALESMANAGER", "ADMIN"] },
      { name: "Tasks",              path: "/crm/activities/tasks",        allowedRoles: ["SALES", "SALESMANAGER"] },
      { name: "Calls",              path: "/crm/activities/calls",        allowedRoles: ["SALES", "SALESMANAGER"] },
      { name: "Emails",             path: "/crm/activities/emails",       allowedRoles: ["SALES", "SALESMANAGER"] },
      { name: "Meetings",           path: "/crm/activities/meetings",     allowedRoles: ["SALES", "SALESMANAGER"] },
      { name: "Lead Sources",       path: "/crm/settings/lead-sources",   allowedRoles: ["SALESMANAGER", "ADMIN"] },
      { name: "Pipelines",          path: "/crm/settings/pipelines",      allowedRoles: ["SALESMANAGER", "ADMIN"] },
      { name: "Scoring Rules",      path: "/crm/settings/scoring-rules",  allowedRoles: ["SALESMANAGER", "ADMIN"] },
    ],
  },
  {
    name: "Finance",
    icon: DollarSign,
    path: "/finance",
    allowedRoles: ["ACCOUNT", "CHACC", "CEO"],
    subItems: [
      { name: "Chart of Accounts", path: "/finance/accounts", allowedRoles: ["ACCOUNT", "CHACC"] },
      { name: "Journal Entries",   path: "/finance/journals", allowedRoles: ["ACCOUNT", "CHACC"] },
      { name: "Reports",           path: "/finance/reports",  allowedRoles: ["ACCOUNT", "CEO"] },
    ],
  },
  {
    name: "HR & Payroll",
    icon: UserCheck,
    path: "/hrm",
    allowedRoles: ["HRMANAGER", "HR_STAFF", "CEO", "BRANCH_MANAGER", "ACCOUNT", "CHACC"],
    subItems: [
      { name: "Department",    path: "/hrm/department",    allowedRoles: ["HRMANAGER", "HR_STAFF"] },
      { name: "Position",      path: "/hrm/position",      allowedRoles: ["HRMANAGER", "HR_STAFF"] },
      { name: "Chart",         path: "",                   allowedRoles: ["CEO", "BRANCH_MANAGER"] },
      { name: "Employees",     path: "/hrm/employees",     allowedRoles: ["HRMANAGER", "HR_STAFF"] },
      { name: "Attendance",    path: "/hrm/attendance",    allowedRoles: ["HRMANAGER", "HR_STAFF"] },
      { name: "Payroll Period",path: "/hrm/payroll",       allowedRoles: ["HRMANAGER", "HR_STAFF"] },
      { name: "Payroll Items", path: "/hrm/payroll-items", allowedRoles: ["HRMANAGER", "HR_STAFF", "ACCOUNT", "CHACC"] },
      { name: "Payroll Run",   path: "/hrm/payroll-runs",  allowedRoles: ["HRMANAGER", "HR_STAFF", "ACCOUNT", "CHACC"] },
    ],
  },
  {
    name: "Reports",
    icon: FileText,
    path: "/reports",
    allowedRoles: ["CEO", "BRANCH_MANAGER"],
    subItems: [
      { name: "Sales Report",     path: "/reports/sales",      allowedRoles: ["CEO", "BRANCH_MANAGER"] },
      { name: "Purchase Report",  path: "/reports/purchase",   allowedRoles: ["CEO", "BRANCH_MANAGER"] },
      { name: "Inventory Report", path: "/reports/inventory",  allowedRoles: ["CEO", "BRANCH_MANAGER"] },
      { name: "Financial Report", path: "/reports/financial",  allowedRoles: ["CEO", "BRANCH_MANAGER"] },
    ],
  },
  {
    name: "Partners",
    icon: Handshake,
    path: "/partners",
    allowedRoles: ["PURCHASE", "ADMIN", "PURCHASEMANAGER"],
    subItems: [
      { name: "All Partners", path: "/partners",              allowedRoles: ["ADMIN"] },
      { name: "Customers",    path: "/partners?type=customer",allowedRoles: ["ADMIN"] },
      { name: "Suppliers",    path: "/partners?type=supplier",allowedRoles: ["PURCHASE", "ADMIN", "PURCHASEMANAGER"] },
    ],
  },
  {
    name: "Branches",
    icon: Building2,
    path: "/company/branches",
    allowedRoles: ["CEO", "ADMIN"],
    subItems: [
      { name: "Branch Management", path: "/company/branches",        allowedRoles: ["ADMIN", "CEO"] },
      { name: "Create Branch",     path: "/company/branches/create", allowedRoles: ["CEO", "ADMIN"] },
    ],
  },
   {
    name: "AI Narrative",
    icon: BrainCircuit,
    path: "/ai-narrative",
    allowedRoles: ["CEO", "ADMIN", "CHACC", "ACCOUNT", "BRANCH_MANAGER"],
  },
  {
    name: "Admin",
    icon: UserCog,
    allowedRoles: ["ADMIN"],
    subItems: [
      { name: "Users",            path: "/admin/users",                allowedRoles: ["ADMIN"] },
      { name: "Currencies",       path: "/master-data/currencies",     allowedRoles: ["ADMIN"] },
      { name: "Exchange Rates",   path: "/master-data/exchange-rates", allowedRoles: ["ADMIN"] },
      { name: "UOM",              path: "/master-data/uoms",           allowedRoles: ["ADMIN"] },
      { name: "UOM Conversions",  path: "/master-data/uom-conversions",allowedRoles: ["ADMIN"] },
      { name: "Taxes",            path: "/master-data/taxes",          allowedRoles: ["ADMIN"] },
    ],
  },
];

export default function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location  = useLocation();
  const { user }  = useSelector((s: RootState) => s.auth);
  const branches  = useSelector((s: RootState) => s.branch.branches || []);
  const defaultBranchId = branches[0]?.id;

  const canAccess = (roles?: string[]) => !roles || roles.includes(user?.role.code ?? "");

  const toggleExpand = (name: string) =>
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );

  const isModuleActive = (item: MenuItem) => {
    if (item.path && location.pathname.startsWith(item.path)) return true;
    return item.subItems?.some((sub) => sub.path && location.pathname.startsWith(sub.path)) ?? false;
  };

  const isSubItemActive = (path: string) => path && location.pathname === path;

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Sidebar header label */}
      <div className="px-4 pt-3 pb-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Navigation
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto pb-4 space-y-0.5 px-2">
        {menuItems
          .filter((item) => canAccess(item.allowedRoles))
          .map((item) => {
            const filteredSubs = item.subItems?.filter((sub) => canAccess(sub.allowedRoles));
            const moduleActive = isModuleActive(item);
            const expanded     = expandedItems.includes(item.name);

            return (
              <div key={item.name}>
                {/* Module row */}
                <div
                  onClick={() => filteredSubs?.length && toggleExpand(item.name)}
                  className={[
                    "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer",
                    "text-sm font-medium transition-colors duration-100 select-none",
                    moduleActive
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  ].join(" ")}
                >
                  {item.path ? (
                    <Link to={item.path} className="flex items-center gap-2.5 flex-1 min-w-0">
                      <item.icon className={`w-4 h-4 shrink-0 ${moduleActive ? "text-orange-500" : "text-gray-400"}`} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <item.icon className={`w-4 h-4 shrink-0 ${moduleActive ? "text-orange-500" : "text-gray-400"}`} />
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
