import { useState, ElementType } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import {
  // LayoutDashboard,
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
  ChevronDown,
  Building2,
} from "lucide-react";

interface MenuItem {
  name: string;
  icon: ElementType;
  path?: string;
  subItems?: {
    name: string;
    path: string;
    allowedRoles?: string[];
  }[];
  allowedRoles?: string[];
}

const menuItems: MenuItem[] = [
  // {
  //   name: "Dashboard",
  //   icon: LayoutDashboard,
  //   path: "/dashboard",
  //   allowedRoles: [
  //     "ADMIN","CEO","SALESMANAGER","SALES",
  //     "WHMANAGER","WHSTAFF","CHACC","ACCOUNT",
  //     "HRMANAGER","PURCHASE","PURCHASEMANAGER",
  //     "BRANCH_MANAGER","HR_STAFF",
  //   ],
  // },

  // ---------------- SALES ----------------
  {
    name: "Sales",
    icon: ShoppingCart,
    path: "/sales",
    allowedRoles: ["SALESMANAGER", "SALES", "CHACC", "ACCOUNT", "WHSTAFF"],
    subItems: [
      {
        name: "Orders",
        path: "/sales/orders",
        allowedRoles: ["SALES", "SALESMANAGER", "CEO", "WHSTAFF", "ACCOUNT"],
      },
      {
        name: "Invoices",
        path: "/invoices",
        allowedRoles: ["ACCOUNT", "CHACC", "CEO"],
      },
      {
        name: "Receipts",
        path: "/receipts",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
      {
        name: "Customers",
        path: "/partners?type=customer",
        allowedRoles: ["SALES", "SALESMANAGER"],
      },
    ],
  },

  // ---------------- PURCHASE ----------------
  {
    name: "Purchase",
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
        name: "Purchase Orders",
        path: "/purchase/orders",
        allowedRoles: ["PURCHASE", "PURCHASEMANAGER", "ACCOUNT"],
      },
      {
        name: "Invoices",
        path: "/purchase/invoices",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
      {
        name: "Payments",
        path: "purchase/payments",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
      {
        name: "Vendors",
        path: "/purchase/vendors",
        allowedRoles: ["PURCHASE", "PURCHASEMANAGER"],
      },
      {
        name: "RFQs",
        path: "/purchase/rfqs",
        allowedRoles: ["PURCHASE", "PURCHASEMANAGER"],
      },
    ],
  },

  // ---------------- INVENTORY ----------------
  {
    name: "Inventory",
    icon: Package,
    path: "/inventory",
    allowedRoles: ["WHMANAGER", "WHSTAFF", "ADMIN"],
    subItems: [
      {
        name: "Products",
        path: "/inventory/products",
        allowedRoles: ["WHMANAGER", "WHSTAFF", "ADMIN"],
      },
      {
        name: "Category",
        path: "/inventory/categories",
        allowedRoles: ["WHMANAGER", "ADMIN", "WHSTAFF"],
      },
      {
        name: "Stock",
        path: "/inventory/stock",
        allowedRoles: ["WHMANAGER", "WHSTAFF"],
      },
      {
        name: "Stock Moves",
        path: "/inventory/stock_move",
        allowedRoles: ["WHMANAGER", "WHSTAFF"],
      },
    ],
  },

  // ---------------- CRM ----------------
  {
    name: "CRM",
    icon: Users,
    path: "/crm",
    allowedRoles: ["SALES", "SALESMANAGER"],
    subItems: [
      {
        name: "Leads",
        path: "/crm/leads",
        allowedRoles: ["SALES", "SALESMANAGER"],
      },
      {
        name: "Opportunities",
        path: "/crm/opportunities",
        allowedRoles: ["SALES", "SALESMANAGER"],
      },
      {
        name: "Task",
        path: "/crm/activities/tasks",
        allowedRoles: ["SALES", "SALESMANAGER"],
      },
      {
        name: "Calls",
        path: "/crm/activities/calls",
        allowedRoles: ["SALES", "SALESMANAGER"],
      },
      {
        name: "Emails",
        path: "/crm/activities/emails",
        allowedRoles: ["SALES", "SALESMANAGER"],
      },
      {
        name: "Meeting",
        path: "/crm/activities/meetings",
        allowedRoles: ["SALES", "SALESMANAGER"],
      },
    ],
  },

  // ---------------- FINANCE ----------------
  {
    name: "Finance & Accounting",
    icon: DollarSign,
    path: "/finance",
    allowedRoles: ["ACCOUNT", "CHACC", "CEO"],
    subItems: [
      {
        name: "Chart of Accounts",
        path: "/finance/accounts",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
      {
        name: "Journal Entries",
        path: "/finance/journals",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
      {
        name: "Bank Reconciliation",
        path: "/finance/bank",
        allowedRoles: ["ACCOUNT", "CHACC"],
      },
      {
        name: "Reports",
        path: "/finance/reports",
        allowedRoles: ["ACCOUNT", "CEO"],
      },
    ],
  },

  // ---------------- HR ----------------
  {
    name: "HR & Payroll",
    icon: UserCheck,
    path: "/hrm",
    allowedRoles: ["HRMANAGER", "HR_STAFF", "CEO", "BRANCH_MANAGER"],
    subItems: [
      {
        name: "Department",
        path: "/hrm/department",
        allowedRoles: ["HRMANAGER", "HR_STAFF"],
      },
      {
        name: "Position",
        path: "/hrm/position",
        allowedRoles: ["HRMANAGER", "HR_STAFF"],
      },
      { name: "Chart", path: "", allowedRoles: ["CEO", "BRANCH_MANAGER"] },
      {
        name: "Employees",
        path: "/hrm/employees",
        allowedRoles: ["HRMANAGER", "HR_STAFF"],
      },
      {
        name: "Attendance",
        path: "/hrm/attendance",
        allowedRoles: ["HRMANAGER", "HR_STAFF"],
      },
      {
        name: "Payroll Period",
        path: "/hrm/payroll",
        allowedRoles: ["HRMANAGER", "HR_STAFF"],
      },
      {
        name: "Payroll Items",
        path: "/hrm/payroll-items",
        allowedRoles: ["HRMANAGER", "HR_STAFF"],
      },
      {
        name: "Payroll Run",
        path: "/hrm/payroll-runs",
        allowedRoles: ["HRMANAGER", "HR_STAFF"],
      },
      {
        name: "Leave Management",
        path: "/hrm/leave",
        allowedRoles: ["HRMANAGER", "HR_STAFF"],
      },
    ],
  },

  // ---------------- REPORTS ----------------
  {
    name: "Reports",
    icon: FileText,
    path: "/reports",
    allowedRoles: ["CEO", "BRANCH_MANAGER"],
    subItems: [
      {
        name: "Sales Report",
        path: "/reports/sales",
        allowedRoles: ["CEO", "BRANCH_MANAGER"],
      },
      {
        name: "Purchase Report",
        path: "/reports/purchase",
        allowedRoles: ["CEO", "BRANCH_MANAGER"],
      },
      {
        name: "Inventory Report",
        path: "/reports/inventory",
        allowedRoles: ["CEO", "BRANCH_MANAGER"],
      },
      {
        name: "Financial Report",
        path: "/reports/financial",
        allowedRoles: ["CEO", "BRANCH_MANAGER"],
      },
    ],
  },

  // ---------------- PARTNERS ----------------
  {
    name: "Partners",
    icon: Handshake,
    path: "/partners",
    allowedRoles: ["PURCHASE", "ADMIN", "PURCHASEMANAGER"],
    subItems: [
      { name: "All Partners", path: "/partners", allowedRoles: ["ADMIN"] },
      {
        name: "Customers",
        path: "/partners?type=customer",
        allowedRoles: ["ADMIN"],
      },
      {
        name: "Supplier",
        path: "/partners?type=supplier",
        allowedRoles: ["PURCHASE", "ADMIN", "PURCHASEMANAGER"],
      },
    ],
  },

  // ---------------- BRANCH ----------------
  {
    name: "Branches",
    icon: Building2,
    path: "/company/branches",
    allowedRoles: ["CEO", "ADMIN"],
    subItems: [
      {
        name: "Branch Management",
        path: "/company/branches",
        allowedRoles: ["ADMIN", "CEO"],
      },
      {
        name: "Create Branch",
        path: "/company/branches/create",
        allowedRoles: ["CEO", "ADMIN"],
      },
    ],
  },

  // ---------------- ADMIN ----------------
  {
    name: "Admin",
    icon: UserCog,
    allowedRoles: ["ADMIN"],
    subItems: [
      { name: "Users", path: "/admin/users", allowedRoles: ["ADMIN"] },
      {
        name: "Currencies",
        path: "/master-data/currencies",
        allowedRoles: ["ADMIN"],
      },
      {
        name: "Exchange Rates",
        path: "/master-data/exchange-rates",
        allowedRoles: ["ADMIN"],
      },
      {
        name: "Units of Measure (UOM)",
        path: "/master-data/uoms",
        allowedRoles: ["ADMIN"],
      },
      {
        name: "UOM Conversions",
        path: "/master-data/uom-conversions",
        allowedRoles: ["ADMIN"],
      },
      { name: "Taxes", path: "/master-data/taxes", allowedRoles: ["ADMIN"] },
    ],
  },
];

export default function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const { user } = useSelector((s: RootState) => s.auth);

  const canAccess = (roles?: string[]) => {
    if (!roles) return true;
    return roles.includes(user?.role.code ?? "");
  };

  // 👇 lấy danh sách chi nhánh từ Redux
  const branches = useSelector((s: RootState) => s.branch.branches || []);
  const defaultBranchId = branches[0]?.id; // tạm lấy chi nhánh đầu tiên

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };
  const isModuleActive = (item: MenuItem) => {
    if (item.path && location.pathname.startsWith(item.path)) return true;
    if (item.subItems) {
      return item.subItems.some((sub) =>
        location.pathname.startsWith(sub.path)
      );
    }
    return false;
  };
  const isActive = (path: string) => path && location.pathname === path;

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Main
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {menuItems
          .filter((item) => canAccess(item.allowedRoles)) // lọc module
          .map((item) => {
            const filteredSubItems = item.subItems?.filter((sub) =>
              canAccess(sub.allowedRoles)
            );

            return (
              <div key={item.name}>
                <div
                  onClick={() =>
                    filteredSubItems ? toggleExpand(item.name) : null
                  }
                  className={`
                    flex items-center justify-between px-4 py-2.5 mx-2 rounded-lg cursor-pointer
                    ${
                      isModuleActive(item)
                        ? "bg-orange-50 text-orange-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }
                    transition-colors
                  `}
                >
                  {item.path ? (
                    <Link
                      to={item.path}
                      className="flex items-center gap-3 flex-1"
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 flex-1">
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                  )}

                  {filteredSubItems &&
                    (expandedItems.includes(item.name) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    ))}
                </div>

                {filteredSubItems && expandedItems.includes(item.name) && (
                  <div className="ml-11 mt-1 space-y-1">
                    {filteredSubItems.map((sub) => {
                      const targetPath =
                        sub.name === "Chart"
                          ? defaultBranchId
                            ? `/hrm/organization/${defaultBranchId}`
                            : "/company/branches"
                          : sub.path;

                      return (
                        <Link
                          key={sub.name}
                          to={targetPath}
                          className={`
                              block px-4 py-2 text-sm rounded-lg
                              ${
                                isActive(targetPath)
                                  ? "bg-orange-50 text-orange-600 font-medium"
                                  : "text-gray-600 hover:bg-gray-50"
                              }
                              transition-colors
                            `}
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

      <div className="px-4 py-3 border-t border-gray-200">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Inventory
        </span>
      </div>
    </aside>
  );
}
