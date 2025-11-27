import { useState, ElementType } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
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
  subItems?: { name: string; path: string }[];
}

const menuItems: MenuItem[] = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    name: "Sales",
    icon: ShoppingCart,
    path: "/sales",
    subItems: [
      { name: "Orders", path: "/sales/orders" },
      { name: "Invoices", path: "/sales/invoices" },
      { name: "Quotations", path: "/sales/quotations" },
      { name: "Customers", path: "/sales/customers" },
    ],
  },
  {
    name: "Purchase",
    icon: ShoppingBag,
    path: "/purchase",
    subItems: [
      { name: "Purchase Orders", path: "/purchase/orders" },
      { name: "Bills", path: "/purchase/bills" },
      { name: "Vendors", path: "/purchase/vendors" },
      { name: "RFQs", path: "/purchase/rfqs" },
    ],
  },
  {
    name: "Inventory",
    icon: Package,
    path: "/inventory",
    subItems: [
      { name: "Products", path: "/inventory/products" },
      { name: "Category", path: "/inventory/categories" },
      { name: "Stock", path: "/inventory/stock" },
      { name: "Transfers", path: "/inventory/transfers" },
      { name: "Adjustments", path: "/inventory/adjustments" },
    ],
  },
  {
    name: "CRM",
    icon: Users,
    path: "/crm",
    subItems: [
      { name: "Leads", path: "/crm/leads" },
      { name: "Opportunities", path: "/crm/opportunities" },
      { name: "Task", path: "/crm/activities/tasks" },
      { name: "Calls", path: "/crm/activities/calls" },
      { name: "Emails", path: "/crm/activities/emails" },
      { name: "Meeting", path: "/crm/activities/meetings" },
    ],
  },
  {
    name: "Finance & Accounting",
    icon: DollarSign,
    path: "/finance",
    subItems: [
      { name: "Chart of Accounts", path: "/finance/accounts" },
      { name: "Journal Entries", path: "/finance/journals" },
      { name: "Bank Reconciliation", path: "/finance/bank" },
      { name: "Reports", path: "/finance/reports" },
    ],
  },
  {
    name: "HR & Payroll",
    icon: UserCheck,
    path: "/hrm",
    subItems: [
      { name: "Employees", path: "/hrm/employees" },
      { name: "Attendance", path: "/hrm/attendance" },
      { name: "Payroll", path: "/hrm/payroll" },
      { name: "Leave Management", path: "/hrm/leave" },
    ],
  },
  {
    name: "Reports",
    icon: FileText,
    path: "/reports",
    subItems: [
      { name: "Sales Report", path: "/reports/sales" },
      { name: "Purchase Report", path: "/reports/purchase" },
      { name: "Inventory Report", path: "/reports/inventory" },
      { name: "Financial Report", path: "/reports/financial" },
    ],
  },
  {
    name: "Partners",
    icon: Handshake,
    path: "/partners",
    subItems: [
      { name: "All Partners", path: "/partners/all" },
      { name: "Customers", path: "/partners/customers" },
      { name: "Vendors", path: "/partners/vendors" },
    ],
  },
  {
    name: "Branches",
    icon: Building2,
    path: "/company/branches",
    subItems: [
      { name: "Branch Management", path: "/company/branches" },
      { name: "Create Branch", path: "/company/branches/create" },
    ],
  },
  {
    name: "Admin",
    icon: UserCog,
    subItems: [
      { name: "Users", path: "/admin/users" },
      { name: "Currencies", path: "/master-data/currencies" },
      { name: "Exchange Rates", path: "/master-data/exchange-rates" },
      { name: "Units of Measure (UOM)", path: "/master-data/uoms" },
      { name: "UOM Conversions", path: "/master-data/uom-conversions" },
      { name: "Taxes", path: "/master-data/taxes" },
    ],
  },
];

export default function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Main Section */}
      <div className="px-4 py-3 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Main
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {menuItems.map((item) => (
          <div key={item.name}>
            <div
              onClick={() => (item.subItems ? toggleExpand(item.name) : null)}
              className={`
                flex items-center justify-between px-4 py-2.5 mx-2 rounded-lg cursor-pointer
                ${item.path && isActive(item.path)
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-700 hover:bg-gray-50"}
                transition-colors
              `}
            >
              {item.path ? (
                <Link to={item.path} className="flex items-center gap-3 flex-1">
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-3 flex-1">
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
              )}

              {item.subItems && (
                expandedItems.includes(item.name) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )
              )}
            </div>

            {/* Sub Items */}
            {item.subItems && expandedItems.includes(item.name) && (
              <div className="ml-11 mt-1 space-y-1">
                {item.subItems.map((subItem) => (
                  <Link
                    key={subItem.path}
                    to={subItem.path}
                    className={`
                      block px-4 py-2 text-sm rounded-lg
                      ${
                        isActive(subItem.path)
                          ? "bg-orange-50 text-orange-600 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }
                      transition-colors
                    `}
                  >
                    {subItem.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Inventory Section */}
      <div className="px-4 py-3 border-t border-gray-200">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Inventory
        </span>
      </div>
    </aside>
  );
}
