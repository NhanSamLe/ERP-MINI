import { User } from "../modules/auth/models/user.model";
import { Role } from "../modules/auth/models/role.model";
import { Company } from "../modules/company/models/company.model";
import { Branch } from "../modules/company/models/branch.model";
import { Product } from "../modules/product/models/product.model";
import { ProductCategory } from "../modules/product/models/productCategory.model";
import { Uom } from "../modules/master-data/models/uom.model";
import { UomConversion } from "../modules/master-data/models/uomConversion.model";
import { Currency } from "../modules/master-data/models/currency.model";
import { ExchangeRate } from "../modules/master-data/models/exchangeRate.model";
import { TaxRate } from "../modules/master-data/models/taxRate.model";
import { Partner } from "../modules/partner/models/partner.model";
import { Lead } from "../modules/crm/models/lead.model";
import { Opportunity } from "../modules/crm/models/opportunity.model";
import { Activity } from "../modules/crm/models/activity.model";
import { SaleOrder } from "../modules/sales/models/saleOrder.model";
import { SaleOrderLine } from "../modules/sales/models/saleOrderLine.model";
import { ArInvoice } from "../modules/sales/models/arInvoice.model";
import { ArInvoiceLine } from "../modules/sales/models/arInvoiceLine.model";
import { ArReceipt } from "../modules/sales/models/arReceipt.model";
import { ArReceiptAllocation } from "../modules/sales/models/arReceiptAllocation.model";
import { PurchaseOrder } from "../modules/purchase/models/purchaseOrder.model";
import { PurchaseOrderLine } from "../modules/purchase/models/purchaseOrderLine.model";
import { ApInvoice } from "../modules/purchase/models/apInvoice.model";
import { ApInvoiceLine } from "../modules/purchase/models/apInvoiceLine.model";
import { ApPayment } from "../modules/purchase/models/apPayment.model";
import { ApPaymentAllocation } from "../modules/purchase/models/apPaymentAllocation.model";
import { Warehouse } from "../modules/inventory/models/warehouse.model";
import { StockMove } from "../modules/inventory/models/stockMove.model";
import { StockMoveLine } from "../modules/inventory/models/stockMoveLine.model";
import { StockBalance } from "../modules/inventory/models/stockBalance.model";
import { Department } from "../modules/hrm/models/department.model";
import { Position } from "../modules/hrm/models/position.model";
import { Employee } from "../modules/hrm/models/employee.model";
import { PayrollPeriod } from "../modules/hrm/models/payrollPeriod.model";
import { PayrollRun } from "../modules/hrm/models/payrollRun.model";
import { PayrollRunLine } from "../modules/hrm/models/payrollRunLine.model";
import { GlAccount } from "../modules/finance/models/glAccount.model";
import { GlJournal } from "../modules/finance/models/glJournal.model";
import { GlEntry } from "../modules/finance/models/glEntry.model";
import { GlEntryLine } from "../modules/finance/models/glEntryLine.model";
import { ProductImage } from "../modules/product/models/productImage.model";
import { CallActivity } from "../modules/crm/models/callActivity.model";
import { MeetingActivity } from "../modules/crm/models/meetingActivity.model";
import { TaskActivity } from "../modules/crm/models/taskActivity.model";
import { EmailActivity } from "../modules/crm/models/emailActivity.model";
import { Attendance } from "../modules/hrm/models/attendance.model";
import { PayrollItem } from "../modules/hrm/models/payrollItem.model";

export function applyAssociations() {
  // =====================
  // AUTH
  // =====================
  // Một User có thể có nhiều Role, và một Role cũng có thể gán cho nhiều User (quan hệ N-N)

  // Một User thuộc về 1 Role
  User.belongsTo(Role, {
    foreignKey: "role_id",
    as: "role",
    onDelete: "SET NULL",
  });

  // Một Role có nhiều User
  Role.hasMany(User, { foreignKey: "role_id", as: "users" });

  // Một User thuộc về một Branch
  User.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });

  // Một Branch có nhiều User
  Branch.hasMany(User, { foreignKey: "branch_id", as: "users" });

  // =====================
  // COMPANY
  // =====================
  // Một Company có nhiều Branch (chi nhánh)
  Company.hasMany(Branch, { foreignKey: "company_id", as: "branches" });
  // Mỗi Branch thuộc về một Company
  Branch.belongsTo(Company, { foreignKey: "company_id", as: "company" });
  // ✅ Branch ↔ Attendance
  Branch.hasMany(Attendance, {
    foreignKey: "branch_id",
    as: "attendances",
  });
  Attendance.belongsTo(Branch, {
    foreignKey: "branch_id",
    as: "branch",
  });
  Branch.hasMany(PayrollItem, {
    foreignKey: "branch_id",
    as: "payrollItems",
  });

PayrollItem.belongsTo(Branch, {
  foreignKey: "branch_id",
  as: "branch",
});
  PayrollItem.belongsTo(Branch, {
    foreignKey: "branch_id",
    as: "branch",
  });
  // ✅ Employee ↔ Attendance
  Employee.hasMany(Attendance, {
    foreignKey: "employee_id",
    as: "attendances",
  });
  Attendance.belongsTo(Employee, {
    foreignKey: "employee_id",
    as: "employee", // 👈 alias CHÍNH XÁC là "employee"
  });

  // =====================
  // PRODUCT
  // =====================
  // Mỗi Product thuộc một Category
  Product.belongsTo(ProductCategory, {
    foreignKey: "category_id",
    as: "category",
  });
  // Một Category có nhiều Product
  ProductCategory.hasMany(Product, {
    foreignKey: "category_id",
    as: "products",
  });

  // Mỗi Product có thể gắn 1 TaxRate
  Product.belongsTo(TaxRate, { foreignKey: "tax_rate_id", as: "taxRate" });
  // Một TaxRate áp dụng cho nhiều Product
  TaxRate.hasMany(Product, { foreignKey: "tax_rate_id", as: "products" });

  // Category có quan hệ cha–con (tree structure)
  ProductCategory.hasMany(ProductCategory, {
    foreignKey: "parent_id",
    as: "children",
  });
  ProductCategory.belongsTo(ProductCategory, {
    foreignKey: "parent_id",
    as: "parent",
  });

  // Mỗi Product có nhiều hình ảnh
  Product.hasMany(ProductImage, { foreignKey: "product_id", as: "images" });
  // Mỗi hình ảnh thuộc về một Product
  ProductImage.belongsTo(Product, { foreignKey: "product_id", as: "product" });

  // =====================
  // MASTER DATA
  // =====================
  // Một Uom có thể convert sang nhiều Uom khác (1-n)
  Uom.hasMany(UomConversion, {
    foreignKey: "from_uom_id",
    as: "fromConversions",
  });
  Uom.hasMany(UomConversion, { foreignKey: "to_uom_id", as: "toConversions" });
  UomConversion.belongsTo(Uom, { foreignKey: "from_uom_id", as: "fromUom" });
  UomConversion.belongsTo(Uom, { foreignKey: "to_uom_id", as: "toUom" });

  // Currency liên kết với ExchangeRate (1 currency là base/quote của nhiều rate)
  Currency.hasMany(ExchangeRate, {
    foreignKey: "base_currency_id",
    as: "baseRates",
  });
  Currency.hasMany(ExchangeRate, {
    foreignKey: "quote_currency_id",
    as: "quoteRates",
  });
  ExchangeRate.belongsTo(Currency, {
    foreignKey: "base_currency_id",
    as: "baseCurrency",
  });
  ExchangeRate.belongsTo(Currency, {
    foreignKey: "quote_currency_id",
    as: "quoteCurrency",
  });

  // =====================
  // CRM
  // =====================
  // Lead được gán cho 1 User (nhân viên sale)
  Lead.belongsTo(User, { foreignKey: "assigned_to", as: "assignedUser" });
  User.hasMany(Lead, { foreignKey: "assigned_to", as: "leads" });
  // lead duoc qualified boi 1 user
  Lead.belongsTo(User, { foreignKey: "qualified_by", as: "qualifiedByUser" });
  User.hasMany(Lead, { foreignKey: "qualified_by", as: "qualifiedLeads" });
  // Opportunity được tạo từ 1 Lead
  Opportunity.belongsTo(Lead, { foreignKey: "lead_id", as: "lead" });
  Lead.hasMany(Opportunity, { foreignKey: "lead_id", as: "opportunities" });

  // Opportunity thuộc về 1 Partner (khách hàng tiềm năng)
  Opportunity.belongsTo(Partner, { foreignKey: "customer_id", as: "customer" });
  Partner.hasMany(Opportunity, {
    foreignKey: "customer_id",
    as: "opportunities",
  });

  // Opportunity có 1 User làm owner
  Opportunity.belongsTo(User, { foreignKey: "owner_id", as: "owner" });
  User.hasMany(Opportunity, {
    foreignKey: "owner_id",
    as: "ownedOpportunities",
  });

  // Activity do 1 User tạo
  Activity.belongsTo(User, { foreignKey: "owner_id", as: "owner" });
  User.hasMany(Activity, { foreignKey: "owner_id", as: "activities" });

  // =====================
  // SALES & AR
  // =====================
  // SaleOrder thuộc về 1 Branch và 1 Customer (Partner)
  SaleOrder.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
  Branch.hasMany(SaleOrder, { foreignKey: "branch_id", as: "saleOrders" });

  SaleOrder.belongsTo(Partner, { foreignKey: "customer_id", as: "customer" });
  Partner.hasMany(SaleOrder, { foreignKey: "customer_id", as: "saleOrders" });

  // SaleOrder có nhiều dòng (SaleOrderLine)
  SaleOrder.hasMany(SaleOrderLine, { foreignKey: "order_id", as: "lines" });
  SaleOrderLine.belongsTo(SaleOrder, { foreignKey: "order_id", as: "order" });

  // Mỗi SaleOrderLine gắn Product + TaxRate
  SaleOrderLine.belongsTo(Product, { foreignKey: "product_id", as: "product" });
  Product.hasMany(SaleOrderLine, {
    foreignKey: "product_id",
    as: "saleOrderLines",
  });

  SaleOrderLine.belongsTo(TaxRate, {
    foreignKey: "tax_rate_id",
    as: "taxRate",
  });
  TaxRate.hasMany(SaleOrderLine, {
    foreignKey: "tax_rate_id",
    as: "saleOrderLines",
  });

  // Invoice thuộc về SaleOrder
  ArInvoice.belongsTo(SaleOrder, { foreignKey: "order_id", as: "order" });
  SaleOrder.hasMany(ArInvoice, { foreignKey: "order_id", as: "invoices" });

  
  // Invoice có nhiều dòng
  ArInvoice.hasMany(ArInvoiceLine, { foreignKey: "invoice_id", as: "lines" });
  ArInvoiceLine.belongsTo(ArInvoice, {
    foreignKey: "invoice_id",
    as: "invoice",
  });
  
  // Mỗi dòng invoice có Product + TaxRate
  ArInvoiceLine.belongsTo(Product, { foreignKey: "product_id", as: "product" });
  Product.hasMany(ArInvoiceLine, {
    foreignKey: "product_id",
    as: "arInvoiceLines",
  });

  ArInvoiceLine.belongsTo(TaxRate, {
    foreignKey: "tax_rate_id",
    as: "taxRate",
  });
  TaxRate.hasMany(ArInvoiceLine, {
    foreignKey: "tax_rate_id",
    as: "arInvoiceLines",
  });

  ArInvoice.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
  Branch.hasMany(ArInvoice, { foreignKey: "branch_id", as: "invoices" });


  // ReceiptAllocation liên kết Receipt ↔ Invoice
  ArReceiptAllocation.belongsTo(ArReceipt, {
    foreignKey: "receipt_id",
    as: "receipt",
  });
  ArReceipt.hasMany(ArReceiptAllocation, {
    foreignKey: "receipt_id",
    as: "allocations",
  });

  ArReceiptAllocation.belongsTo(ArInvoice, {
    foreignKey: "invoice_id",
    as: "invoice",
  });
  ArInvoice.hasMany(ArReceiptAllocation, {
    foreignKey: "invoice_id",
    as: "allocations",
  });

  SaleOrder.belongsTo(User, { as: "creator", foreignKey: "created_by" });
  SaleOrder.belongsTo(User, { as: "approver", foreignKey: "approved_by" });

  ArInvoice.belongsTo(User, { as: "creator", foreignKey: "created_by" });
  ArInvoice.belongsTo(User, { as: "approver", foreignKey: "approved_by" });

  ArReceipt.belongsTo(User, { as: "creator", foreignKey: "created_by" });
  ArReceipt.belongsTo(User, { as: "approver", foreignKey: "approved_by" });
ArReceipt.belongsTo(Partner, {
  foreignKey: "customer_id",
  as: "customer",
});

Partner.hasMany(ArReceipt, {
  foreignKey: "customer_id",
  as: "receipts",
});

  // =====================
  // PURCHASE & AP
  // =====================
  // PurchaseOrder ↔ Lines
  PurchaseOrder.hasMany(PurchaseOrderLine, {
    foreignKey: "po_id",
    as: "lines",
  });
  PurchaseOrderLine.belongsTo(PurchaseOrder, {
    foreignKey: "po_id",
    as: "order",
  });

  // PurchaseOrder ↔ Invoice
  PurchaseOrder.hasMany(ApInvoice, { foreignKey: "po_id", as: "invoices" });
  ApInvoice.belongsTo(PurchaseOrder, { foreignKey: "po_id", as: "order" });

  // PurchaseOrder ↔ user
  User.hasMany(PurchaseOrder, {
    as: "purchase_orders",
    foreignKey: "created_by",
  });
  PurchaseOrder.belongsTo(User, {
    as: "creator",
    foreignKey: "created_by",
  });

  User.hasMany(PurchaseOrder, {
    as: "approvedPOs",
    foreignKey: "approved_by",
  });
  PurchaseOrder.belongsTo(User, {
    as: "approver",
    foreignKey: "approved_by",
  });

  // ApInvoice ↔ Lines
  ApInvoice.hasMany(ApInvoiceLine, {
    foreignKey: "ap_invoice_id",
    as: "lines",
  });
  ApInvoiceLine.belongsTo(ApInvoice, {
    foreignKey: "ap_invoice_id",
    as: "invoice",
  });

  // ApPayment ↔ Allocations
  ApPayment.hasMany(ApPaymentAllocation, {
    foreignKey: "payment_id",
    as: "allocations",
  });
  ApPaymentAllocation.belongsTo(ApPayment, {
    foreignKey: "payment_id",
    as: "payment",
  });

  ApInvoice.hasMany(ApPaymentAllocation, {
    foreignKey: "ap_invoice_id",
    as: "allocations",
  });
  ApPaymentAllocation.belongsTo(ApInvoice, {
    foreignKey: "ap_invoice_id",
    as: "invoice",
  });

  // =====================
  // INVENTORY
  // =====================
  // Warehouse ↔ StockMoves
  Warehouse.hasMany(StockMove, {
    foreignKey: "warehouse_from_id",
    as: "moves_from",
  });
  StockMove.belongsTo(Warehouse, {
    foreignKey: "warehouse_from_id",
    as: "warehouse_from",
  });

  // Warehouse → StockMove (to)
  Warehouse.hasMany(StockMove, {
    foreignKey: "warehouse_to_id",
    as: "moves_to",
  });
  StockMove.belongsTo(Warehouse, {
    foreignKey: "warehouse_to_id",
    as: "warehouse_to",
  });

  // StockMove ↔ Lines
  StockMove.hasMany(StockMoveLine, { foreignKey: "move_id", as: "lines" });
  StockMoveLine.belongsTo(StockMove, { foreignKey: "move_id", as: "move" });

  // Product ↔ StockMoveLines
  Product.hasMany(StockMoveLine, {
    foreignKey: "product_id",
    as: "stockMoveLines",
  });
  StockMoveLine.belongsTo(Product, { foreignKey: "product_id", as: "product" });

  // StockMove ↔ User
  StockMove.belongsTo(User, {
    as: "creator",
    foreignKey: "created_by",
  });

  StockMove.belongsTo(User, {
    as: "approver",
    foreignKey: "approved_by",
  });

  User.hasMany(StockMove, {
    as: "created_stock_moves",
    foreignKey: "created_by",
  });

  User.hasMany(StockMove, {
    as: "approved_stock_moves",
    foreignKey: "approved_by",
  });

  // Warehouse ↔ StockBalance
  Warehouse.hasMany(StockBalance, {
    foreignKey: "warehouse_id",
    as: "balances",
  });
  StockBalance.belongsTo(Warehouse, {
    foreignKey: "warehouse_id",
    as: "warehouse",
  });

  // Product ↔ StockBalance
  Product.hasMany(StockBalance, { foreignKey: "product_id", as: "balances" });
  StockBalance.belongsTo(Product, { foreignKey: "product_id", as: "product" });

  // =====================
  // HRM
  // =====================
  // Branch ↔ Department, Position, Employee
  Branch.hasMany(Department, { foreignKey: "branch_id", as: "departments" });
  Department.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });

  Branch.hasMany(Position, { foreignKey: "branch_id", as: "positions" });
  Position.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });

  Branch.hasMany(Employee, { foreignKey: "branch_id", as: "employees" });
  Employee.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });

  // Department ↔ Employee
  Department.hasMany(Employee, {
    foreignKey: "department_id",
    as: "employees",
  });
  Employee.belongsTo(Department, {
    foreignKey: "department_id",
    as: "department",
  });

  // Position ↔ Employee
  Position.hasMany(Employee, { foreignKey: "position_id", as: "employees" });
  Employee.belongsTo(Position, { foreignKey: "position_id", as: "position" });

  // PayrollPeriod ↔ Branch
  Branch.hasMany(PayrollPeriod, {
    foreignKey: "branch_id",
    as: "payrollPeriods",
  });
  PayrollPeriod.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });

  // PayrollPeriod ↔ PayrollRun
  PayrollPeriod.hasMany(PayrollRun, { foreignKey: "period_id", as: "runs" });
  PayrollRun.belongsTo(PayrollPeriod, {
    foreignKey: "period_id",
    as: "period",
  });

  // PayrollRun ↔ PayrollRunLine
  PayrollRun.hasMany(PayrollRunLine, { foreignKey: "run_id", as: "lines" });
  PayrollRunLine.belongsTo(PayrollRun, { foreignKey: "run_id", as: "run" });

  // Employee ↔ PayrollRunLine
  Employee.hasMany(PayrollRunLine, {
    foreignKey: "employee_id",
    as: "payrollLines",
  });
  PayrollRunLine.belongsTo(Employee, {
    foreignKey: "employee_id",
    as: "employee",
  });

  // =====================
  // FINANCE & GL
  // =====================
  // Journal ↔ Entries
  GlJournal.hasMany(GlEntry, { foreignKey: "journal_id", as: "entries" });
  GlEntry.belongsTo(GlJournal, { foreignKey: "journal_id", as: "journal" });

  // Entry ↔ EntryLines
  GlEntry.hasMany(GlEntryLine, { foreignKey: "entry_id", as: "lines" });
  GlEntryLine.belongsTo(GlEntry, { foreignKey: "entry_id", as: "entry" });

  // Account ↔ EntryLines
  GlAccount.hasMany(GlEntryLine, {
    foreignKey: "account_id",
    as: "entryLines",
  });
  GlEntryLine.belongsTo(GlAccount, { foreignKey: "account_id", as: "account" });

  // Partner ↔ EntryLines (theo dõi công nợ khách hàng/nhà cung cấp)
  Partner.hasMany(GlEntryLine, { foreignKey: "partner_id", as: "glEntries" });
  GlEntryLine.belongsTo(Partner, { foreignKey: "partner_id", as: "partner" });
}

// ===============================
//   ACTIVITY → CALL (1-1)
// ===============================
Activity.hasOne(CallActivity, {
  foreignKey: "activity_id",
  as: "call",
  onDelete: "CASCADE",
});
CallActivity.belongsTo(Activity, {
  foreignKey: "activity_id",
  as: "activity",
});

// ===============================
//   ACTIVITY → EMAIL (1-1)
// ===============================
Activity.hasOne(EmailActivity, {
  foreignKey: "activity_id",
  as: "email",
  onDelete: "CASCADE",
});
EmailActivity.belongsTo(Activity, {
  foreignKey: "activity_id",
  as: "activity",
});

// ===============================
//   ACTIVITY → MEETING (1-1)
// ===============================
Activity.hasOne(MeetingActivity, {
  foreignKey: "activity_id",
  as: "meeting",
  onDelete: "CASCADE",
});
MeetingActivity.belongsTo(Activity, {
  foreignKey: "activity_id",
  as: "activity",
});

// ===============================
//   ACTIVITY → TASK (1-1)
// ===============================
Activity.hasOne(TaskActivity, {
  foreignKey: "activity_id",
  as: "task",
  onDelete: "CASCADE",
});
TaskActivity.belongsTo(Activity, {
  foreignKey: "activity_id",
  as: "activity",
});

// Activity <-> Lead
Activity.belongsTo(Lead, {
  foreignKey: "related_id",
  as: "lead",
  constraints: false,
});

// Activity <-> Opportunity
Activity.belongsTo(Opportunity, {
  foreignKey: "related_id",
  as: "opportunity",
  constraints: false,
});

// Activity <-> Customer (Partner)
Activity.belongsTo(Partner, {
  foreignKey: "related_id",
  as: "customer",
  constraints: false,
});
