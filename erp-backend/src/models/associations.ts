import { User } from "../modules/auth/models/user.model";
import { Role } from "../modules/auth/models/role.model";
import { Company } from "../modules/company/models/company.model";
import { Branch } from "../modules/company/models/branch.model";
import { Product } from "../modules/product/models/product.model";
import { ProductCategory } from "../modules/product/models/productCategory.model";
import { ProductSupplierInfo } from "../modules/product/models/productSupplierInfo.model";
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
import { ApPaymentAuditLog } from "../modules/purchase/models/apPaymentAuditLog.model";
import { ApInvoiceAuditLog } from "../modules/purchase/models/apInvoiceAuditLog.model";
import { Warehouse } from "../modules/inventory/models/warehouse.model";
import { StockMove } from "../modules/inventory/models/stockMove.model";
import { StockMoveLine } from "../modules/inventory/models/stockMoveLine.model";
import { StockBalance } from "../modules/inventory/models/stockBalance.model";
import { StockLocation } from "../modules/inventory/models/stockLocation.model";
import { StockLot } from "../modules/inventory/models/stockLot.model";
import { PhysicalInventory } from "../modules/inventory/models/physicalInventory.model";
import { PhysicalInventoryLine } from "../modules/inventory/models/physicalInventoryLine.model";
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
import { EmployeeFace } from "../modules/hrm/models/employeeFace.model";
import { Permission } from "../modules/auth/models/permission.model";
import { RolePermission } from "../modules/auth/models/rolePermission.model";
import { UserRole } from "../modules/auth/models/userRole.model";
import { FiscalYear } from "../modules/finance/models/fiscalYear.model";
import { FiscalPeriod } from "../modules/finance/models/fiscalPeriod.model";
import { PaymentTerm } from "../modules/master-data/models/paymentTerm.model";
import { BankAccount } from "../modules/master-data/models/bankAccount.model";
// Phase 2: CRM
import { LeadSource } from "../modules/crm/models/leadSource.model";
import { Pipeline } from "../modules/crm/models/pipeline.model";
import { PipelineStage } from "../modules/crm/models/pipelineStage.model";
// Phase 3: Quotation + PriceList
import { Quotation } from "../modules/sales/models/quotation.model";
import { QuotationLine } from "../modules/sales/models/quotationLine.model";
import { PriceList } from "../modules/sales/models/priceList.model";
import { PriceListItem } from "../modules/sales/models/priceListItem.model";
// Phase 4: Sales Return + Credit Notes
import { SalesReturnAuthorization } from "../modules/sales/models/salesReturnAuthorization.model";
import { SalesReturn } from "../modules/sales/models/salesReturn.model";
import { SalesReturnLine } from "../modules/sales/models/salesReturnLine.model";
import { ArCreditNote } from "../modules/sales/models/arCreditNote.model";
import { ArCreditNoteLine } from "../modules/sales/models/arCreditNoteLine.model";
import { ArRefund } from "../modules/sales/models/arRefund.model";
import { InvoiceDocument } from "../modules/document-intelligence/models/invoiceDocument.model";
import { OcrFieldMapping } from "../modules/document-intelligence/models/ocrFieldMapping.model";
// Phase 5: Purchase Enhancement
import { PurchaseRfq } from "../modules/purchase/models/purchaseRfq.model";
import { PurchaseRfqLine } from "../modules/purchase/models/purchaseRfqLine.model";
import { PurchaseReturnAuthorization } from "../modules/purchase/models/purchaseReturnAuthorization.model";
import { PurchaseReturn } from "../modules/purchase/models/purchaseReturn.model";
import { PurchaseReturnLine } from "../modules/purchase/models/purchaseReturnLine.model";
import { ApDebitNote } from "../modules/purchase/models/apDebitNote.model";
import { ApDebitNoteLine } from "../modules/purchase/models/apDebitNoteLine.model";
import { VendorRefund } from "../modules/purchase/models/vendorRefund.model";
import { PurchasePriceList } from "../modules/purchase/models/purchasePriceList.model";
import { PurchasePriceListItem } from "../modules/purchase/models/purchasePriceListItem.model";
import { BlogPost } from "../modules/blog/models/blogPost.model";
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

  // =====================
  // RBAC (Phase 1)
  // =====================
  // Role ↔ Permission (N-N) qua RolePermission
  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: "role_id",
    otherKey: "permission_id",
    as: "permissions",
  });
  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: "permission_id",
    otherKey: "role_id",
    as: "roles",
  });

  // RolePermission → Permission (for eager loading)
  RolePermission.belongsTo(Permission, {
    foreignKey: "permission_id",
    as: "permission",
  });
  Permission.hasMany(RolePermission, {
    foreignKey: "permission_id",
    as: "rolePermissions",
  });
  RolePermission.belongsTo(Role, {
    foreignKey: "role_id",
    as: "permissionRole",
  });
  Role.hasMany(RolePermission, {
    foreignKey: "role_id",
    as: "rolePermissions",
  });

  // User ↔ Role (N-N) qua UserRole — DEFERRED: hiện tại dùng User.role_id (belongsTo)
  // Uncomment khi chuyển sang multi-role system
  // User.belongsToMany(Role, {
  //   through: UserRole,
  //   foreignKey: "user_id",
  //   otherKey: "role_id",
  //   as: "userRoles",
  // });
  // Role.belongsToMany(User, {
  //   through: UserRole,
  //   foreignKey: "role_id",
  //   otherKey: "user_id",
  //   as: "roleUsers",
  // });

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
  // ✅ Employee ↔ Attendance
  Employee.hasMany(Attendance, {
    foreignKey: "employee_id",
    as: "attendances",
  });
  Attendance.belongsTo(Employee, {
    foreignKey: "employee_id",
    as: "employee", // 👈 alias CHÍNH XÁC là "employee"
  });

  // ✅ Employee ↔ EmployeeFace
  Employee.hasMany(EmployeeFace, {
    foreignKey: "employee_id",
    as: "faces",
    onDelete: "CASCADE",
  });
  EmployeeFace.belongsTo(Employee, {
    foreignKey: "employee_id",
    as: "employee",
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
  SaleOrderLine.belongsTo(Uom, { foreignKey: "uom_id", as: "uom" });
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
  ArReceipt.belongsTo(Currency, { foreignKey: "currency_id", as: "currency" });

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
  // PurchaseOrder ↔ Product

  PurchaseOrderLine.belongsTo(Product, {
    foreignKey: "product_id",
    as: "product",
  });
  Product.hasMany(PurchaseOrderLine, {
    foreignKey: "product_id",
    as: "purchaseOrderLines",
  });

  // PurchaseOrderLine ↔ UOM
  PurchaseOrderLine.belongsTo(Uom, {
    foreignKey: "uom_id",
    as: "uom",
  });
  Uom.hasMany(PurchaseOrderLine, {
    foreignKey: "uom_id",
    as: "purchaseOrderLines",
  });

  // PurchaseOrder ↔ Invoice (one-to-many: a PO can have multiple partial invoices)
  PurchaseOrder.hasMany(ApInvoice, { foreignKey: "po_id", as: "invoices" });
  ApInvoice.belongsTo(PurchaseOrder, { foreignKey: "po_id", as: "order" });

  // PurchaseOrder ↔ Partner (Supplier)

  PurchaseOrder.belongsTo(Partner, {
    foreignKey: "supplier_id",
    as: "supplier",
  });

  Partner.hasMany(PurchaseOrder, {
    foreignKey: "supplier_id",
    as: "purchaseOrders",
  });

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

  // ApInvoice ↔ Product
  ApInvoiceLine.belongsTo(Product, {
    foreignKey: "product_id",
    as: "product",
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

  ApInvoice.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
  Branch.hasMany(ApInvoice, { foreignKey: "branch_id", as: "apInvoices" });

  ApPayment.belongsTo(Branch, {
    foreignKey: "branch_id",
    as: "branch",
  });

  Branch.hasMany(ApPayment, {
    foreignKey: "branch_id",
    as: "ap_payments",
  });

  ApPayment.belongsTo(Partner, {
    foreignKey: "supplier_id",
    as: "supplier",
  });

  Partner.hasMany(ApPayment, {
    foreignKey: "supplier_id",
    as: "payments",
  });
  ApInvoice.belongsTo(User, { as: "creator", foreignKey: "created_by" });
  ApInvoice.belongsTo(User, { as: "approver", foreignKey: "approved_by" });

  // ApInvoiceAuditLog associations
  ApInvoiceAuditLog.belongsTo(ApInvoice, {
    foreignKey: "ap_invoice_id",
    as: "invoice",
  });
  ApInvoice.hasMany(ApInvoiceAuditLog, {
    foreignKey: "ap_invoice_id",
    as: "auditLogs",
  });
  ApInvoiceAuditLog.belongsTo(User, { foreignKey: "created_by", as: "actor" });

  ApPayment.belongsTo(User, { as: "creator", foreignKey: "created_by" });
  ApPayment.belongsTo(User, { as: "approver", foreignKey: "approved_by" });

  // ApPaymentAuditLog associations
  ApPaymentAuditLog.belongsTo(ApPayment, {
    foreignKey: "payment_id",
    as: "payment",
  });
  ApPayment.hasMany(ApPaymentAuditLog, {
    foreignKey: "payment_id",
    as: "auditLogs",
  });
  ApPaymentAuditLog.belongsTo(User, { foreignKey: "created_by", as: "actor" });

  // InvoiceDocument associations
  InvoiceDocument.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
  Branch.hasMany(InvoiceDocument, {
    foreignKey: "branch_id",
    as: "invoiceDocuments",
  });

  InvoiceDocument.belongsTo(User, { foreignKey: "created_by", as: "creator" });
  User.hasMany(InvoiceDocument, {
    foreignKey: "created_by",
    as: "invoiceDocuments",
  });

  InvoiceDocument.belongsTo(ApInvoice, {
    foreignKey: "purchase_invoice_id",
    as: "apInvoice",
  });
  ApInvoice.hasOne(InvoiceDocument, {
    foreignKey: "purchase_invoice_id",
    as: "invoiceDocument",
  });

  ApInvoice.belongsTo(Partner, {
    foreignKey: "supplier_id",
    as: "invoiceSupplier",
  });

  ApInvoiceLine.belongsTo(PurchaseOrderLine, {
    foreignKey: "po_line_id",
    as: "poLine",
  });
  ApInvoiceLine.belongsTo(StockMoveLine, {
    foreignKey: "grn_line_id",
    as: "grnLine",
  });

  OcrFieldMapping.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
  OcrFieldMapping.belongsTo(Partner, { foreignKey: "vendor_id", as: "vendor" });

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
  // INVENTORY V2 — Locations, Lots, Physical Inventory
  // =====================

  // Warehouse ↔ StockLocations
  Warehouse.hasMany(StockLocation, {
    foreignKey: "warehouse_id",
    as: "locations",
  });
  StockLocation.belongsTo(Warehouse, {
    foreignKey: "warehouse_id",
    as: "warehouse",
  });

  // StockLocation self-reference (parent ↔ children)
  StockLocation.hasMany(StockLocation, {
    foreignKey: "parent_id",
    as: "children",
  });
  StockLocation.belongsTo(StockLocation, {
    foreignKey: "parent_id",
    as: "parent",
  });

  // StockLocation ↔ StockBalance
  StockLocation.hasMany(StockBalance, {
    foreignKey: "location_id",
    as: "balances",
  });
  StockBalance.belongsTo(StockLocation, {
    foreignKey: "location_id",
    as: "location",
  });

  // StockLocation ↔ StockMoveLine (from / to)
  StockLocation.hasMany(StockMoveLine, {
    foreignKey: "location_from_id",
    as: "moveLineFrom",
  });
  StockMoveLine.belongsTo(StockLocation, {
    foreignKey: "location_from_id",
    as: "locationFrom",
  });

  StockLocation.hasMany(StockMoveLine, {
    foreignKey: "location_to_id",
    as: "moveLineTo",
  });
  StockMoveLine.belongsTo(StockLocation, {
    foreignKey: "location_to_id",
    as: "locationTo",
  });

  // Product ↔ StockLots
  Product.hasMany(StockLot, { foreignKey: "product_id", as: "lots" });
  StockLot.belongsTo(Product, { foreignKey: "product_id", as: "product" });

  // Partner (supplier) ↔ StockLots
  Partner.hasMany(StockLot, { foreignKey: "supplier_id", as: "suppliedLots" });
  StockLot.belongsTo(Partner, { foreignKey: "supplier_id", as: "supplier" });

  // StockLot ↔ StockMoveLine
  StockLot.hasMany(StockMoveLine, { foreignKey: "lot_id", as: "moveLines" });
  StockMoveLine.belongsTo(StockLot, { foreignKey: "lot_id", as: "lot" });

  // StockLot ↔ StockBalance
  StockLot.hasMany(StockBalance, { foreignKey: "lot_id", as: "balances" });
  StockBalance.belongsTo(StockLot, { foreignKey: "lot_id", as: "lot" });

  // Uom ↔ StockMoveLine
  Uom.hasMany(StockMoveLine, { foreignKey: "uom_id", as: "stockMoveLines" });
  StockMoveLine.belongsTo(Uom, { foreignKey: "uom_id", as: "uom" });

  // Uom ↔ Product (sale uom / purchase uom)
  Uom.hasMany(Product, { foreignKey: "uom_id", as: "products" });
  Product.belongsTo(Uom, { foreignKey: "uom_id", as: "uom" });

  Uom.hasMany(Product, {
    foreignKey: "purchase_uom_id",
    as: "purchaseProducts",
  });
  Product.belongsTo(Uom, { foreignKey: "purchase_uom_id", as: "purchaseUom" });

  // Product ↔ ProductSupplierInfo
  Product.hasMany(ProductSupplierInfo, {
    foreignKey: "product_id",
    as: "supplierInfos",
  });
  ProductSupplierInfo.belongsTo(Product, {
    foreignKey: "product_id",
    as: "product",
  });

  // Partner (supplier) ↔ ProductSupplierInfo
  Partner.hasMany(ProductSupplierInfo, {
    foreignKey: "supplier_id",
    as: "productSupplierInfos",
  });
  ProductSupplierInfo.belongsTo(Partner, {
    foreignKey: "supplier_id",
    as: "supplier",
  });

  // Currency ↔ ProductSupplierInfo
  Currency.hasMany(ProductSupplierInfo, {
    foreignKey: "currency_id",
    as: "supplierInfos",
  });
  ProductSupplierInfo.belongsTo(Currency, {
    foreignKey: "currency_id",
    as: "currency",
  });

  // PhysicalInventory ↔ Warehouse / Branch / User
  Warehouse.hasMany(PhysicalInventory, {
    foreignKey: "warehouse_id",
    as: "physicalInventories",
  });
  PhysicalInventory.belongsTo(Warehouse, {
    foreignKey: "warehouse_id",
    as: "warehouse",
  });

  Branch.hasMany(PhysicalInventory, {
    foreignKey: "branch_id",
    as: "physicalInventories",
  });
  PhysicalInventory.belongsTo(Branch, {
    foreignKey: "branch_id",
    as: "branch",
  });

  User.hasMany(PhysicalInventory, {
    foreignKey: "created_by",
    as: "createdInventories",
  });
  PhysicalInventory.belongsTo(User, {
    foreignKey: "created_by",
    as: "creator",
  });

  User.hasMany(PhysicalInventory, {
    foreignKey: "validated_by",
    as: "validatedInventories",
  });
  PhysicalInventory.belongsTo(User, {
    foreignKey: "validated_by",
    as: "validator",
  });

  // PhysicalInventory ↔ Lines
  PhysicalInventory.hasMany(PhysicalInventoryLine, {
    foreignKey: "inventory_id",
    as: "lines",
  });
  PhysicalInventoryLine.belongsTo(PhysicalInventory, {
    foreignKey: "inventory_id",
    as: "inventory",
  });

  // PhysicalInventoryLine ↔ Product / Location / Lot
  Product.hasMany(PhysicalInventoryLine, {
    foreignKey: "product_id",
    as: "inventoryLines",
  });
  PhysicalInventoryLine.belongsTo(Product, {
    foreignKey: "product_id",
    as: "product",
  });

  StockLocation.hasMany(PhysicalInventoryLine, {
    foreignKey: "location_id",
    as: "inventoryLines",
  });
  PhysicalInventoryLine.belongsTo(StockLocation, {
    foreignKey: "location_id",
    as: "location",
  });

  StockLot.hasMany(PhysicalInventoryLine, {
    foreignKey: "lot_id",
    as: "inventoryLines",
  });
  PhysicalInventoryLine.belongsTo(StockLot, {
    foreignKey: "lot_id",
    as: "lot",
  });

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

  // =====================
  // PHASE 1: MASTER DATA + FISCAL + PARTNER ENHANCEMENTS
  // =====================

  // FiscalYear ↔ FiscalPeriod
  FiscalYear.hasMany(FiscalPeriod, {
    foreignKey: "fiscal_year_id",
    as: "periods",
  });
  FiscalPeriod.belongsTo(FiscalYear, {
    foreignKey: "fiscal_year_id",
    as: "fiscalYear",
  });
  FiscalPeriod.belongsTo(User, { foreignKey: "closed_by", as: "closedByUser" });

  // FiscalYear ↔ Company
  FiscalYear.belongsTo(Company, { foreignKey: "company_id", as: "company" });

  // GlEntry ↔ FiscalPeriod
  GlEntry.belongsTo(FiscalPeriod, {
    foreignKey: "fiscal_period_id",
    as: "fiscalPeriod",
  });
  FiscalPeriod.hasMany(GlEntry, {
    foreignKey: "fiscal_period_id",
    as: "entries",
  });

  // GlEntry ↔ Branch
  GlEntry.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });

  // BankAccount associations
  BankAccount.belongsTo(Company, { foreignKey: "company_id", as: "company" });
  BankAccount.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
  BankAccount.belongsTo(Currency, {
    foreignKey: "currency_id",
    as: "currency",
  });
  BankAccount.belongsTo(GlAccount, {
    foreignKey: "gl_account_id",
    as: "glAccount",
  });

  // Partner enhancements
  Partner.belongsTo(PaymentTerm, {
    foreignKey: "payment_term_id",
    as: "paymentTerm",
  });
  Partner.belongsTo(Currency, { foreignKey: "currency_id", as: "currency" });
  Partner.belongsTo(User, { foreignKey: "sales_person_id", as: "salesPerson" });

  // =====================
  // PHASE 2: CRM ENHANCEMENT
  // =====================

  // Pipeline ↔ PipelineStage
  Pipeline.hasMany(PipelineStage, { foreignKey: "pipeline_id", as: "stages" });
  PipelineStage.belongsTo(Pipeline, {
    foreignKey: "pipeline_id",
    as: "pipeline",
  });

  // Lead ↔ LeadSource
  Lead.belongsTo(LeadSource, { foreignKey: "source_id", as: "leadSource" });
  LeadSource.hasMany(Lead, { foreignKey: "source_id", as: "leads" });
  Lead.belongsTo(Partner, { foreignKey: "customer_id", as: "customer" });
  Partner.hasMany(Lead, { foreignKey: "customer_id", as: "convertedLeads" });

  // Opportunity ↔ Pipeline/Stage
  Opportunity.belongsTo(Pipeline, { foreignKey: "pipeline_id", as: "pipeline" });
  Opportunity.belongsTo(PipelineStage, { foreignKey: "pipeline_stage_id", as: "pipelineStage" });
  Opportunity.belongsTo(Currency, { foreignKey: "currency_id", as: "currency" });

  // =====================
  // PHASE 3: QUOTATION + SALES ENHANCEMENT
  // =====================

  // Quotation ↔ Lines
  Quotation.hasMany(QuotationLine, { foreignKey: "quotation_id", as: "lines" });
  QuotationLine.belongsTo(Quotation, {
    foreignKey: "quotation_id",
    as: "quotation",
  });

  // Quotation ↔ Partner, Branch, Currency, PaymentTerm, Opportunity, User
  Quotation.belongsTo(Partner, { foreignKey: "customer_id", as: "customer" });
  Quotation.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
  Quotation.belongsTo(Currency, { foreignKey: "currency_id", as: "currency" });
  Quotation.belongsTo(PaymentTerm, {
    foreignKey: "payment_term_id",
    as: "paymentTerm",
  });
  Quotation.belongsTo(Opportunity, {
    foreignKey: "opportunity_id",
    as: "opportunity",
  });
  Quotation.belongsTo(User, {
    foreignKey: "sales_person_id",
    as: "salesPerson",
  });
  Quotation.belongsTo(User, { foreignKey: "created_by", as: "creator" });
  Quotation.belongsTo(User, { foreignKey: "approved_by", as: "approver" });
  Quotation.belongsTo(Quotation, { foreignKey: "parent_id", as: "parent" });

  // QuotationLine ↔ Product, TaxRate, Uom
  QuotationLine.belongsTo(Product, { foreignKey: "product_id", as: "product" });
  QuotationLine.belongsTo(TaxRate, { foreignKey: "tax_rate_id", as: "taxRate" });
  QuotationLine.belongsTo(Uom, { foreignKey: "uom_id", as: "uom" });

  // SaleOrder ↔ Quotation, Currency, PaymentTerm
  SaleOrder.belongsTo(Quotation, {
    foreignKey: "quotation_id",
    as: "quotation",
  });
  SaleOrder.belongsTo(Currency, { foreignKey: "currency_id", as: "currency" });
  SaleOrder.belongsTo(PaymentTerm, {
    foreignKey: "payment_term_id",
    as: "paymentTerm",
  });
  SaleOrder.belongsTo(User, {
    foreignKey: "sales_person_id",
    as: "salesPerson",
  });

  // PriceList ↔ PriceListItem
  PriceList.hasMany(PriceListItem, {
    foreignKey: "price_list_id",
    as: "items",
  });
  PriceListItem.belongsTo(PriceList, {
    foreignKey: "price_list_id",
    as: "priceList",
  });
  PriceList.belongsTo(Currency, { foreignKey: "currency_id", as: "currency" });
  PriceListItem.belongsTo(Product, { foreignKey: "product_id", as: "product" });

  // =====================
  // PHASE 4: AR ENHANCEMENT + SALES RETURN
  // =====================

  // ArInvoice ↔ PaymentTerm, Currency, Partner
  ArInvoice.belongsTo(PaymentTerm, { foreignKey: "payment_term_id", as: "paymentTerm" });
  ArInvoice.belongsTo(Currency, { foreignKey: "currency_id", as: "currency" });
  ArInvoice.belongsTo(Partner, { foreignKey: "customer_id", as: "customer" });

  // SalesReturnAuthorization (RMA)
  SalesReturnAuthorization.belongsTo(Branch, {
    foreignKey: "branch_id",
    as: "branch",
  });
  SalesReturnAuthorization.belongsTo(SaleOrder, {
    foreignKey: "sale_order_id",
    as: "saleOrder",
  });
  SalesReturnAuthorization.belongsTo(ArInvoice, {
    foreignKey: "invoice_id",
    as: "invoice",
  });
  SalesReturnAuthorization.belongsTo(Partner, {
    foreignKey: "customer_id",
    as: "customer",
  });
  SalesReturnAuthorization.belongsTo(User, {
    foreignKey: "created_by",
    as: "creator",
  });
  SalesReturnAuthorization.belongsTo(User, {
    foreignKey: "approved_by",
    as: "approver",
  });

  // SalesReturn ↔ RMA, Lines
  SalesReturn.hasMany(SalesReturnLine, {
    foreignKey: "return_id",
    as: "lines",
  });
  SalesReturnLine.belongsTo(SalesReturn, {
    foreignKey: "return_id",
    as: "salesReturn",
  });
  SalesReturn.belongsTo(SalesReturnAuthorization, {
    foreignKey: "rma_id",
    as: "rma",
  });
  SalesReturn.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
  SalesReturn.belongsTo(Partner, { foreignKey: "customer_id", as: "customer" });
  SalesReturn.belongsTo(Warehouse, {
    foreignKey: "warehouse_id",
    as: "warehouse",
  });
  SalesReturn.belongsTo(SaleOrder, {
    foreignKey: "sale_order_id",
    as: "saleOrder",
  });
  SalesReturnLine.belongsTo(Product, {
    foreignKey: "product_id",
    as: "product",
  });

  // ArCreditNote ↔ Lines
  ArCreditNote.hasMany(ArCreditNoteLine, {
    foreignKey: "credit_note_id",
    as: "lines",
  });
  ArCreditNoteLine.belongsTo(ArCreditNote, {
    foreignKey: "credit_note_id",
    as: "creditNote",
  });
  ArCreditNote.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
  ArCreditNote.belongsTo(SalesReturn, {
    foreignKey: "sales_return_id",
    as: "salesReturn",
  });
  ArCreditNote.belongsTo(ArInvoice, {
    foreignKey: "original_invoice_id",
    as: "originalInvoice",
  });
  ArCreditNote.belongsTo(Partner, {
    foreignKey: "customer_id",
    as: "customer",
  });
  ArCreditNote.belongsTo(Currency, {
    foreignKey: "currency_id",
    as: "currency",
  });
  ArCreditNoteLine.belongsTo(Product, {
    foreignKey: "product_id",
    as: "product",
  });
  ArCreditNoteLine.belongsTo(TaxRate, {
    foreignKey: "tax_rate_id",
    as: "taxRate",
  });

  // ArRefund
  ArRefund.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
  ArRefund.belongsTo(ArCreditNote, {
    foreignKey: "credit_note_id",
    as: "creditNote",
  });
  ArRefund.belongsTo(Partner, { foreignKey: "customer_id", as: "customer" });
  ArRefund.belongsTo(Currency, { foreignKey: "currency_id", as: "currency" });
  ArRefund.belongsTo(BankAccount, {
    foreignKey: "bank_account_id",
    as: "bankAccount",
  });
  ArRefund.belongsTo(GlEntry, { foreignKey: "gl_entry_id", as: "glEntry" });

  // ArReceipt ↔ BankAccount
  ArReceipt.belongsTo(BankAccount, {
    foreignKey: "bank_account_id",
    as: "bankAccount",
  });

  // =====================
  // PHASE 5: PURCHASE ENHANCEMENT — RFQ + Return + Debit Note + Vendor Refund
  // =====================

  // PurchaseRfq ↔ Lines
  PurchaseRfq.hasMany(PurchaseRfqLine, { foreignKey: "rfq_id", as: "lines" });
  PurchaseRfqLine.belongsTo(PurchaseRfq, { foreignKey: "rfq_id", as: "rfq" });

  // PurchaseRfq ↔ Branch, Partner, Currency, PaymentTerm, User
  PurchaseRfq.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
  PurchaseRfq.belongsTo(Partner, { foreignKey: "supplier_id", as: "supplier" });
  PurchaseRfq.belongsTo(Currency, {
    foreignKey: "currency_id",
    as: "currency",
  });
  PurchaseRfq.belongsTo(PaymentTerm, {
    foreignKey: "payment_term_id",
    as: "paymentTerm",
  });
  PurchaseRfq.belongsTo(User, { foreignKey: "buyer_id", as: "buyer" });
  PurchaseRfq.belongsTo(User, { foreignKey: "created_by", as: "creator" });
  PurchaseRfq.belongsTo(User, { foreignKey: "approved_by", as: "approver" });
  PurchaseRfq.belongsTo(PurchaseRfq, { foreignKey: "parent_id", as: "parent" });

  // PurchaseRfqLine ↔ Product, TaxRate, Uom
  PurchaseRfqLine.belongsTo(Product, {
    foreignKey: "product_id",
    as: "product",
  });
  PurchaseRfqLine.belongsTo(TaxRate, {
    foreignKey: "tax_rate_id",
    as: "taxRate",
  });
  PurchaseRfqLine.belongsTo(Uom, { foreignKey: "uom_id", as: "uom" });

  // PurchaseOrder ↔ RFQ
  PurchaseOrder.belongsTo(PurchaseRfq, { foreignKey: "rfq_id", as: "rfq" });
  PurchaseRfq.hasMany(PurchaseOrder, {
    foreignKey: "rfq_id",
    as: "purchaseOrders",
  });

  // PurchaseOrder ↔ Currency, PaymentTerm, Buyer
  PurchaseOrder.belongsTo(Currency, {
    foreignKey: "currency_id",
    as: "currency",
  });
  PurchaseOrder.belongsTo(PaymentTerm, {
    foreignKey: "payment_term_id",
    as: "paymentTerm",
  });
  PurchaseOrder.belongsTo(User, { foreignKey: "buyer_id", as: "buyer" });

  // PurchaseReturnAuthorization (PRA)
  PurchaseReturnAuthorization.belongsTo(Branch, {
    foreignKey: "branch_id",
    as: "branch",
  });
  PurchaseReturnAuthorization.belongsTo(PurchaseOrder, {
    foreignKey: "purchase_order_id",
    as: "purchaseOrder",
  });
  PurchaseReturnAuthorization.belongsTo(ApInvoice, {
    foreignKey: "ap_invoice_id",
    as: "apInvoice",
  });
  PurchaseReturnAuthorization.belongsTo(Partner, {
    foreignKey: "supplier_id",
    as: "supplier",
  });
  PurchaseReturnAuthorization.belongsTo(User, {
    foreignKey: "created_by",
    as: "creator",
  });
  PurchaseReturnAuthorization.belongsTo(User, {
    foreignKey: "approved_by",
    as: "approver",
  });

  // PurchaseReturn ↔ Lines
  PurchaseReturn.hasMany(PurchaseReturnLine, {
    foreignKey: "return_id",
    as: "lines",
  });
  PurchaseReturnLine.belongsTo(PurchaseReturn, {
    foreignKey: "return_id",
    as: "purchaseReturn",
  });
  PurchaseReturn.belongsTo(PurchaseReturnAuthorization, {
    foreignKey: "pra_id",
    as: "pra",
  });
  PurchaseReturn.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
  PurchaseReturn.belongsTo(Partner, {
    foreignKey: "supplier_id",
    as: "supplier",
  });
  PurchaseReturn.belongsTo(Warehouse, {
    foreignKey: "warehouse_id",
    as: "warehouse",
  });
  PurchaseReturn.belongsTo(PurchaseOrder, {
    foreignKey: "purchase_order_id",
    as: "purchaseOrder",
  });
  PurchaseReturn.belongsTo(User, { foreignKey: "created_by", as: "creator" });
  PurchaseReturn.belongsTo(User, { foreignKey: "approved_by", as: "approver" });
  PurchaseReturnLine.belongsTo(Product, {
    foreignKey: "product_id",
    as: "product",
  });
  PurchaseReturnLine.belongsTo(PurchaseOrderLine, {
    foreignKey: "po_line_id",
    as: "poLine",
  });
  PurchaseReturnLine.belongsTo(Uom, {
    foreignKey: "uom_id",
    as: "uom",
  });
  Uom.hasMany(PurchaseReturnLine, {
    foreignKey: "uom_id",
    as: "purchaseReturnLines",
  });

  // ApDebitNote ↔ Lines
  ApDebitNote.hasMany(ApDebitNoteLine, {
    foreignKey: "debit_note_id",
    as: "lines",
  });
  ApDebitNoteLine.belongsTo(ApDebitNote, {
    foreignKey: "debit_note_id",
    as: "debitNote",
  });
  ApDebitNote.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
  ApDebitNote.belongsTo(PurchaseReturn, {
    foreignKey: "purchase_return_id",
    as: "purchaseReturn",
  });
  ApDebitNote.belongsTo(ApInvoice, {
    foreignKey: "original_ap_invoice_id",
    as: "originalApInvoice",
  });
  ApDebitNote.belongsTo(Partner, { foreignKey: "supplier_id", as: "supplier" });
  ApDebitNote.belongsTo(Currency, {
    foreignKey: "currency_id",
    as: "currency",
  });
  ApDebitNote.belongsTo(GlEntry, { foreignKey: "gl_entry_id", as: "glEntry" });
  ApDebitNote.belongsTo(User, { foreignKey: "created_by", as: "creator" });
  ApDebitNote.belongsTo(User, { foreignKey: "approved_by", as: "approver" });
  ApDebitNoteLine.belongsTo(Product, {
    foreignKey: "product_id",
    as: "product",
  });
  ApDebitNoteLine.belongsTo(PurchaseReturnLine, {
    foreignKey: "return_line_id",
    as: "returnLine",
  });
  ApDebitNoteLine.belongsTo(TaxRate, {
    foreignKey: "tax_rate_id",
    as: "taxRate",
  });

  // VendorRefund
  VendorRefund.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });
  VendorRefund.belongsTo(ApDebitNote, {
    foreignKey: "debit_note_id",
    as: "debitNote",
  });
  VendorRefund.belongsTo(Partner, {
    foreignKey: "supplier_id",
    as: "supplier",
  });
  VendorRefund.belongsTo(BankAccount, {
    foreignKey: "bank_account_id",
    as: "bankAccount",
  });
  VendorRefund.belongsTo(Currency, {
    foreignKey: "currency_id",
    as: "currency",
  });
  VendorRefund.belongsTo(GlEntry, { foreignKey: "gl_entry_id", as: "glEntry" });
  VendorRefund.belongsTo(User, { foreignKey: "created_by", as: "creator" });
  VendorRefund.belongsTo(User, { foreignKey: "approved_by", as: "approver" });

  // PurchasePriceList ↔ Items
  PurchasePriceList.hasMany(PurchasePriceListItem, {
    foreignKey: "price_list_id",
    as: "items",
  });
  PurchasePriceListItem.belongsTo(PurchasePriceList, {
    foreignKey: "price_list_id",
    as: "priceList",
  });
  PurchasePriceList.belongsTo(Partner, {
    foreignKey: "supplier_id",
    as: "supplier",
  });
  PurchasePriceList.belongsTo(Currency, {
    foreignKey: "currency_id",
    as: "currency",
  });
  PurchasePriceList.belongsTo(User, {
    foreignKey: "created_by",
    as: "creator",
  });
  PurchasePriceListItem.belongsTo(Product, {
    foreignKey: "product_id",
    as: "product",
  });
  PurchasePriceListItem.belongsTo(Partner, {
    foreignKey: "supplier_id",
    as: "supplier",
  });
  PurchasePriceListItem.belongsTo(Uom, { foreignKey: "uom_id", as: "uom" });

  // AP Payment ↔ BankAccount, Currency
  ApPayment.belongsTo(BankAccount, {
    foreignKey: "bank_account_id",
    as: "bankAccount",
  });
  ApPayment.belongsTo(Currency, { foreignKey: "currency_id", as: "currency" });

  // AP Invoice ↔ PaymentTerm, Currency
  ApInvoice.belongsTo(PaymentTerm, {
    foreignKey: "payment_term_id",
    as: "paymentTerm",
  });
  ApInvoice.belongsTo(Currency, { foreignKey: "currency_id", as: "currency" });

  // =====================
  // BLOG POSTS
  // =====================
  BlogPost.belongsTo(User, { foreignKey: "author_id", as: "author", onDelete: "CASCADE" });
  User.hasMany(BlogPost, { foreignKey: "author_id", as: "blogPosts" });

  BlogPost.belongsTo(Product, { foreignKey: "product_id", as: "product", onDelete: "SET NULL" });
  Product.hasMany(BlogPost, { foreignKey: "product_id", as: "blogPosts" });
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
