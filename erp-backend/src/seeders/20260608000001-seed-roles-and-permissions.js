"use strict";

/**
 * Seed: Roles + Permissions + RolePermissions
 *
 * Roles (12):
 *   ADMIN, CEO, BRANCH_MANAGER, SALESMANAGER, SALES,
 *   WHMANAGER, WHSTAFF, CHACC, ACCOUNT, HRMANAGER,
 *   PURCHASEMANAGER, PURCHASE
 *
 * Chạy: npx sequelize-cli db:seed --seed 20260608000001-seed-roles-and-permissions.js
 * Undo: npx sequelize-cli db:seed:undo --seed 20260608000001-seed-roles-and-permissions.js
 */

// ── 1. Định nghĩa Roles ─────────────────────────────────
const ROLES = [
  { code: "ADMIN",           name: "Quản trị hệ thống" },
  { code: "CEO",             name: "Giám đốc điều hành" },
  { code: "BRANCH_MANAGER",  name: "Quản lý chi nhánh" },
  { code: "SALESMANAGER",    name: "Quản lý bán hàng" },
  { code: "SALES",           name: "Nhân viên bán hàng" },
  { code: "WHMANAGER",       name: "Quản lý kho" },
  { code: "WHSTAFF",         name: "Nhân viên kho" },
  { code: "CHACC",           name: "Kế toán trưởng" },
  { code: "ACCOUNT",         name: "Kế toán viên" },
  { code: "HRMANAGER",       name: "Quản lý nhân sự" },
  { code: "PURCHASEMANAGER", name: "Quản lý mua hàng" },
  { code: "PURCHASE",        name: "Nhân viên mua hàng" },
];

// ── 2. Định nghĩa Permissions ───────────────────────────
// Format code: module.resource.action
const PERMISSIONS = [
  // ── AUTH / USER ──────────────────────────────────────
  { code: "auth.user.view",   name: "Xem danh sách người dùng",   module: "auth",    resource: "user",        action: "view"   },
  { code: "auth.user.create", name: "Tạo người dùng",              module: "auth",    resource: "user",        action: "create" },
  { code: "auth.user.update", name: "Cập nhật người dùng",         module: "auth",    resource: "user",        action: "update" },
  { code: "auth.user.delete", name: "Xóa người dùng",              module: "auth",    resource: "user",        action: "delete" },

  // ── COMPANY / BRANCH ─────────────────────────────────
  { code: "company.branch.view",   name: "Xem chi nhánh",   module: "company", resource: "branch", action: "view"   },
  { code: "company.branch.create", name: "Tạo chi nhánh",   module: "company", resource: "branch", action: "create" },
  { code: "company.branch.update", name: "Sửa chi nhánh",   module: "company", resource: "branch", action: "update" },
  { code: "company.branch.delete", name: "Xóa chi nhánh",   module: "company", resource: "branch", action: "delete" },

  // ── CRM ──────────────────────────────────────────────
  { code: "crm.lead.view",         name: "Xem khách hàng tiềm năng",    module: "crm", resource: "lead",        action: "view"   },
  { code: "crm.lead.create",       name: "Tạo khách hàng tiềm năng",    module: "crm", resource: "lead",        action: "create" },
  { code: "crm.lead.update",       name: "Cập nhật khách hàng tiềm năng", module: "crm", resource: "lead",      action: "update" },
  { code: "crm.lead.delete",       name: "Xóa khách hàng tiềm năng",    module: "crm", resource: "lead",        action: "delete" },
  { code: "crm.opportunity.view",  name: "Xem cơ hội kinh doanh",       module: "crm", resource: "opportunity", action: "view"   },
  { code: "crm.opportunity.create",name: "Tạo cơ hội kinh doanh",       module: "crm", resource: "opportunity", action: "create" },
  { code: "crm.opportunity.update",name: "Cập nhật cơ hội kinh doanh",  module: "crm", resource: "opportunity", action: "update" },
  { code: "crm.activity.view",     name: "Xem hoạt động CRM",           module: "crm", resource: "activity",    action: "view"   },
  { code: "crm.activity.create",   name: "Tạo hoạt động CRM",           module: "crm", resource: "activity",    action: "create" },
  { code: "crm.activity.update",   name: "Cập nhật hoạt động CRM",      module: "crm", resource: "activity",    action: "update" },

  // ── SALES ─────────────────────────────────────────────
  { code: "sales.quotation.view",    name: "Xem báo giá",              module: "sales", resource: "quotation",  action: "view"   },
  { code: "sales.quotation.create",  name: "Tạo báo giá",              module: "sales", resource: "quotation",  action: "create" },
  { code: "sales.quotation.update",  name: "Sửa báo giá",              module: "sales", resource: "quotation",  action: "update" },
  { code: "sales.quotation.approve", name: "Duyệt báo giá",            module: "sales", resource: "quotation",  action: "approve"},
  { code: "sales.sale_order.view",   name: "Xem đơn bán hàng",         module: "sales", resource: "sale_order", action: "view"   },
  { code: "sales.sale_order.create", name: "Tạo đơn bán hàng",         module: "sales", resource: "sale_order", action: "create" },
  { code: "sales.sale_order.update", name: "Sửa đơn bán hàng",         module: "sales", resource: "sale_order", action: "update" },
  { code: "sales.sale_order.approve",name: "Duyệt đơn bán hàng",       module: "sales", resource: "sale_order", action: "approve"},
  { code: "sales.sale_order.delete", name: "Xóa đơn bán hàng",         module: "sales", resource: "sale_order", action: "delete" },
  { code: "sales.ar_invoice.view",   name: "Xem hóa đơn bán ra",       module: "sales", resource: "ar_invoice", action: "view"   },
  { code: "sales.ar_invoice.create", name: "Tạo hóa đơn bán ra",       module: "sales", resource: "ar_invoice", action: "create" },
  { code: "sales.ar_invoice.approve",name: "Duyệt hóa đơn bán ra",     module: "sales", resource: "ar_invoice", action: "approve"},
  { code: "sales.ar_invoice.export", name: "Xuất hóa đơn bán ra",      module: "sales", resource: "ar_invoice", action: "export" },
  { code: "sales.ar_receipt.view",   name: "Xem phiếu thu",            module: "sales", resource: "ar_receipt", action: "view"   },
  { code: "sales.ar_receipt.create", name: "Tạo phiếu thu",            module: "sales", resource: "ar_receipt", action: "create" },
  { code: "sales.ar_receipt.approve",name: "Duyệt phiếu thu",          module: "sales", resource: "ar_receipt", action: "approve"},
  { code: "sales.return.view",       name: "Xem trả hàng bán",         module: "sales", resource: "return",     action: "view"   },
  { code: "sales.return.create",     name: "Tạo trả hàng bán",         module: "sales", resource: "return",     action: "create" },
  { code: "sales.return.approve",    name: "Duyệt trả hàng bán",       module: "sales", resource: "return",     action: "approve"},

  // ── PURCHASE ──────────────────────────────────────────
  { code: "purchase.rfq.view",           name: "Xem yêu cầu báo giá",      module: "purchase", resource: "rfq",           action: "view"   },
  { code: "purchase.rfq.create",         name: "Tạo yêu cầu báo giá",      module: "purchase", resource: "rfq",           action: "create" },
  { code: "purchase.rfq.update",         name: "Sửa yêu cầu báo giá",      module: "purchase", resource: "rfq",           action: "update" },
  { code: "purchase.purchase_order.view",   name: "Xem đơn mua hàng",      module: "purchase", resource: "purchase_order", action: "view"   },
  { code: "purchase.purchase_order.create", name: "Tạo đơn mua hàng",      module: "purchase", resource: "purchase_order", action: "create" },
  { code: "purchase.purchase_order.update", name: "Sửa đơn mua hàng",      module: "purchase", resource: "purchase_order", action: "update" },
  { code: "purchase.purchase_order.approve",name: "Duyệt đơn mua hàng",    module: "purchase", resource: "purchase_order", action: "approve"},
  { code: "purchase.purchase_order.delete", name: "Xóa đơn mua hàng",      module: "purchase", resource: "purchase_order", action: "delete" },
  { code: "purchase.ap_invoice.view",    name: "Xem hóa đơn mua vào",      module: "purchase", resource: "ap_invoice",    action: "view"   },
  { code: "purchase.ap_invoice.create",  name: "Tạo hóa đơn mua vào",      module: "purchase", resource: "ap_invoice",    action: "create" },
  { code: "purchase.ap_invoice.approve", name: "Duyệt hóa đơn mua vào",    module: "purchase", resource: "ap_invoice",    action: "approve"},
  { code: "purchase.ap_payment.view",    name: "Xem phiếu chi",             module: "purchase", resource: "ap_payment",    action: "view"   },
  { code: "purchase.ap_payment.create",  name: "Tạo phiếu chi",             module: "purchase", resource: "ap_payment",    action: "create" },
  { code: "purchase.ap_payment.approve", name: "Duyệt phiếu chi",           module: "purchase", resource: "ap_payment",    action: "approve"},
  { code: "purchase.return.view",        name: "Xem trả hàng mua",          module: "purchase", resource: "return",        action: "view"   },
  { code: "purchase.return.create",      name: "Tạo trả hàng mua",          module: "purchase", resource: "return",        action: "create" },
  { code: "purchase.return.approve",     name: "Duyệt trả hàng mua",        module: "purchase", resource: "return",        action: "approve"},

  // ── INVENTORY ─────────────────────────────────────────
  { code: "inventory.warehouse.view",   name: "Xem kho hàng",             module: "inventory", resource: "warehouse",   action: "view"   },
  { code: "inventory.warehouse.create", name: "Tạo kho hàng",             module: "inventory", resource: "warehouse",   action: "create" },
  { code: "inventory.warehouse.update", name: "Sửa kho hàng",             module: "inventory", resource: "warehouse",   action: "update" },
  { code: "inventory.stock_move.view",  name: "Xem phiếu kho",            module: "inventory", resource: "stock_move",  action: "view"   },
  { code: "inventory.stock_move.create",name: "Tạo phiếu kho",            module: "inventory", resource: "stock_move",  action: "create" },
  { code: "inventory.stock_move.approve",name:"Duyệt phiếu kho",          module: "inventory", resource: "stock_move",  action: "approve"},
  { code: "inventory.stock_balance.view",name:"Xem tồn kho",              module: "inventory", resource: "stock_balance",action: "view"  },
  { code: "inventory.stock_balance.export",name:"Xuất báo cáo tồn kho",   module: "inventory", resource: "stock_balance",action: "export"},
  { code: "inventory.physical.view",    name: "Xem kiểm kê kho",          module: "inventory", resource: "physical",    action: "view"   },
  { code: "inventory.physical.create",  name: "Tạo kiểm kê kho",          module: "inventory", resource: "physical",    action: "create" },
  { code: "inventory.physical.approve", name: "Duyệt kiểm kê kho",        module: "inventory", resource: "physical",    action: "approve"},

  // ── HRM ───────────────────────────────────────────────
  { code: "hrm.employee.view",        name: "Xem nhân viên",              module: "hrm", resource: "employee",       action: "view"   },
  { code: "hrm.employee.create",      name: "Tạo nhân viên",              module: "hrm", resource: "employee",       action: "create" },
  { code: "hrm.employee.update",      name: "Sửa nhân viên",              module: "hrm", resource: "employee",       action: "update" },
  { code: "hrm.employee.delete",      name: "Xóa nhân viên",              module: "hrm", resource: "employee",       action: "delete" },
  { code: "hrm.department.view",      name: "Xem phòng ban",              module: "hrm", resource: "department",     action: "view"   },
  { code: "hrm.department.create",    name: "Tạo phòng ban",              module: "hrm", resource: "department",     action: "create" },
  { code: "hrm.department.update",    name: "Sửa phòng ban",              module: "hrm", resource: "department",     action: "update" },
  { code: "hrm.position.view",        name: "Xem chức vụ",                module: "hrm", resource: "position",       action: "view"   },
  { code: "hrm.position.create",      name: "Tạo chức vụ",                module: "hrm", resource: "position",       action: "create" },
  { code: "hrm.position.update",      name: "Sửa chức vụ",                module: "hrm", resource: "position",       action: "update" },
  { code: "hrm.attendance.view",      name: "Xem chấm công",              module: "hrm", resource: "attendance",     action: "view"   },
  { code: "hrm.attendance.create",    name: "Tạo chấm công",              module: "hrm", resource: "attendance",     action: "create" },
  { code: "hrm.attendance.update",    name: "Sửa chấm công",              module: "hrm", resource: "attendance",     action: "update" },
  { code: "hrm.leave_request.view",   name: "Xem đơn nghỉ phép",          module: "hrm", resource: "leave_request",  action: "view"   },
  { code: "hrm.leave_request.create", name: "Tạo đơn nghỉ phép",          module: "hrm", resource: "leave_request",  action: "create" },
  { code: "hrm.leave_request.approve",name: "Duyệt đơn nghỉ phép",        module: "hrm", resource: "leave_request",  action: "approve"},
  { code: "hrm.payroll.view",         name: "Xem bảng lương",             module: "hrm", resource: "payroll",        action: "view"   },
  { code: "hrm.payroll.create",       name: "Tạo bảng lương",             module: "hrm", resource: "payroll",        action: "create" },
  { code: "hrm.payroll.approve",      name: "Duyệt bảng lương",           module: "hrm", resource: "payroll",        action: "approve"},
  { code: "hrm.payroll.export",       name: "Xuất bảng lương",            module: "hrm", resource: "payroll",        action: "export" },

  // ── FINANCE / GL ──────────────────────────────────────
  { code: "finance.gl_account.view",   name: "Xem tài khoản kế toán",     module: "finance", resource: "gl_account",  action: "view"   },
  { code: "finance.gl_account.create", name: "Tạo tài khoản kế toán",     module: "finance", resource: "gl_account",  action: "create" },
  { code: "finance.gl_account.update", name: "Sửa tài khoản kế toán",     module: "finance", resource: "gl_account",  action: "update" },
  { code: "finance.gl_account.delete", name: "Xóa tài khoản kế toán",     module: "finance", resource: "gl_account",  action: "delete" },
  { code: "finance.gl_entry.view",     name: "Xem bút toán",               module: "finance", resource: "gl_entry",    action: "view"   },
  { code: "finance.gl_entry.create",   name: "Tạo bút toán thủ công",      module: "finance", resource: "gl_entry",    action: "create" },
  { code: "finance.gl_entry.approve",  name: "Duyệt/ghi sổ bút toán",     module: "finance", resource: "gl_entry",    action: "approve"},
  { code: "finance.report.view",       name: "Xem báo cáo tài chính",      module: "finance", resource: "report",      action: "view"   },
  { code: "finance.report.export",     name: "Xuất báo cáo tài chính",     module: "finance", resource: "report",      action: "export" },
  { code: "finance.fiscal.view",       name: "Xem kỳ kế toán",             module: "finance", resource: "fiscal",      action: "view"   },
  { code: "finance.fiscal.update",     name: "Đóng/mở kỳ kế toán",        module: "finance", resource: "fiscal",      action: "update" },

  // ── MASTER DATA ───────────────────────────────────────
  { code: "master.partner.view",        name: "Xem đối tác",              module: "master", resource: "partner",       action: "view"   },
  { code: "master.partner.create",      name: "Tạo đối tác",              module: "master", resource: "partner",       action: "create" },
  { code: "master.partner.update",      name: "Sửa đối tác",              module: "master", resource: "partner",       action: "update" },
  { code: "master.partner.delete",      name: "Xóa đối tác",              module: "master", resource: "partner",       action: "delete" },
  { code: "master.product.view",        name: "Xem sản phẩm",             module: "master", resource: "product",       action: "view"   },
  { code: "master.product.create",      name: "Tạo sản phẩm",             module: "master", resource: "product",       action: "create" },
  { code: "master.product.update",      name: "Sửa sản phẩm",             module: "master", resource: "product",       action: "update" },
  { code: "master.product.delete",      name: "Xóa sản phẩm",             module: "master", resource: "product",       action: "delete" },
  { code: "master.uom.view",            name: "Xem đơn vị tính",          module: "master", resource: "uom",           action: "view"   },
  { code: "master.uom.create",          name: "Tạo đơn vị tính",          module: "master", resource: "uom",           action: "create" },
  { code: "master.uom.update",          name: "Sửa đơn vị tính",          module: "master", resource: "uom",           action: "update" },
  { code: "master.tax.view",            name: "Xem thuế suất",            module: "master", resource: "tax",           action: "view"   },
  { code: "master.tax.create",          name: "Tạo thuế suất",            module: "master", resource: "tax",           action: "create" },
  { code: "master.tax.update",          name: "Sửa thuế suất",            module: "master", resource: "tax",           action: "update" },
  { code: "master.payment_term.view",   name: "Xem điều khoản thanh toán", module: "master", resource: "payment_term", action: "view"   },
  { code: "master.payment_term.create", name: "Tạo điều khoản thanh toán", module: "master", resource: "payment_term", action: "create" },
  { code: "master.payment_term.update", name: "Sửa điều khoản thanh toán", module: "master", resource: "payment_term", action: "update" },
  { code: "master.currency.view",       name: "Xem tiền tệ",              module: "master", resource: "currency",      action: "view"   },
  { code: "master.currency.update",     name: "Cập nhật tỷ giá",          module: "master", resource: "currency",      action: "update" },

  // ── REPORTS ───────────────────────────────────────────
  { code: "reports.inventory.view",  name: "Xem báo cáo tồn kho",        module: "reports", resource: "inventory", action: "view"   },
  { code: "reports.inventory.export",name: "Xuất báo cáo tồn kho",       module: "reports", resource: "inventory", action: "export" },
  { code: "reports.sales.view",      name: "Xem báo cáo bán hàng",       module: "reports", resource: "sales",     action: "view"   },
  { code: "reports.sales.export",    name: "Xuất báo cáo bán hàng",      module: "reports", resource: "sales",     action: "export" },
  { code: "reports.purchase.view",   name: "Xem báo cáo mua hàng",       module: "reports", resource: "purchase",  action: "view"   },
  { code: "reports.ocr.view",        name: "Xem báo cáo OCR",            module: "reports", resource: "ocr",       action: "view"   },
];

// ── 3. Mapping role → danh sách permission codes ───────
const ROLE_PERMISSIONS = {
  // ADMIN: bypass toàn bộ (không cần seed RolePermission,
  //        middleware ADMIN check role.code trực tiếp)
  // CEO: xem & export toàn bộ
  CEO: [
    "auth.user.view",
    "company.branch.view",
    "crm.lead.view", "crm.opportunity.view", "crm.activity.view",
    "sales.quotation.view", "sales.sale_order.view", "sales.ar_invoice.view", "sales.ar_invoice.export",
    "sales.ar_receipt.view", "sales.return.view",
    "purchase.rfq.view", "purchase.purchase_order.view", "purchase.ap_invoice.view",
    "purchase.ap_payment.view", "purchase.return.view",
    "inventory.warehouse.view", "inventory.stock_move.view", "inventory.stock_balance.view",
    "inventory.stock_balance.export", "inventory.physical.view",
    "hrm.employee.view", "hrm.department.view", "hrm.position.view",
    "hrm.attendance.view", "hrm.leave_request.view", "hrm.payroll.view", "hrm.payroll.export",
    "finance.gl_account.view", "finance.gl_entry.view", "finance.report.view", "finance.report.export",
    "finance.fiscal.view",
    "master.partner.view", "master.product.view", "master.uom.view",
    "master.tax.view", "master.payment_term.view", "master.currency.view",
    "reports.inventory.view", "reports.inventory.export",
    "reports.sales.view", "reports.sales.export",
    "reports.purchase.view", "reports.ocr.view",
  ],

  // BRANCH_MANAGER: quản lý toàn chi nhánh (trừ finance sâu)
  BRANCH_MANAGER: [
    "auth.user.view", "auth.user.create", "auth.user.update",
    "company.branch.view", "company.branch.update",
    "crm.lead.view", "crm.lead.create", "crm.lead.update",
    "crm.opportunity.view", "crm.opportunity.create", "crm.opportunity.update",
    "crm.activity.view", "crm.activity.create", "crm.activity.update",
    "sales.quotation.view", "sales.quotation.create", "sales.quotation.update", "sales.quotation.approve",
    "sales.sale_order.view", "sales.sale_order.create", "sales.sale_order.update", "sales.sale_order.approve",
    "sales.ar_invoice.view", "sales.ar_invoice.create", "sales.ar_invoice.approve", "sales.ar_invoice.export",
    "sales.ar_receipt.view", "sales.ar_receipt.create", "sales.ar_receipt.approve",
    "sales.return.view", "sales.return.create", "sales.return.approve",
    "purchase.rfq.view", "purchase.rfq.create", "purchase.rfq.update",
    "purchase.purchase_order.view", "purchase.purchase_order.create",
    "purchase.purchase_order.update", "purchase.purchase_order.approve",
    "purchase.ap_invoice.view", "purchase.ap_invoice.create", "purchase.ap_invoice.approve",
    "purchase.ap_payment.view", "purchase.ap_payment.create", "purchase.ap_payment.approve",
    "purchase.return.view", "purchase.return.create", "purchase.return.approve",
    "inventory.warehouse.view", "inventory.stock_move.view", "inventory.stock_move.approve",
    "inventory.stock_balance.view", "inventory.stock_balance.export",
    "inventory.physical.view", "inventory.physical.create", "inventory.physical.approve",
    "hrm.employee.view", "hrm.department.view", "hrm.position.view",
    "hrm.attendance.view", "hrm.leave_request.view", "hrm.leave_request.approve",
    "hrm.payroll.view",
    "finance.gl_entry.view", "finance.report.view", "finance.report.export", "finance.fiscal.view",
    "master.partner.view", "master.partner.create", "master.partner.update",
    "master.product.view", "master.uom.view", "master.tax.view", "master.payment_term.view", "master.currency.view",
    "reports.inventory.view", "reports.sales.view", "reports.purchase.view",
  ],

  // SALESMANAGER: quản lý bán hàng + CRM
  SALESMANAGER: [
    "crm.lead.view", "crm.lead.create", "crm.lead.update", "crm.lead.delete",
    "crm.opportunity.view", "crm.opportunity.create", "crm.opportunity.update",
    "crm.activity.view", "crm.activity.create", "crm.activity.update",
    "sales.quotation.view", "sales.quotation.create", "sales.quotation.update", "sales.quotation.approve",
    "sales.sale_order.view", "sales.sale_order.create", "sales.sale_order.update", "sales.sale_order.approve",
    "sales.ar_invoice.view", "sales.ar_invoice.create", "sales.ar_invoice.export",
    "sales.ar_receipt.view", "sales.ar_receipt.create",
    "sales.return.view", "sales.return.create", "sales.return.approve",
    "master.partner.view", "master.partner.create", "master.partner.update",
    "master.product.view", "master.uom.view", "master.tax.view", "master.payment_term.view",
    "reports.sales.view", "reports.sales.export",
  ],

  // SALES: nhân viên bán hàng
  SALES: [
    "crm.lead.view", "crm.lead.create", "crm.lead.update",
    "crm.opportunity.view", "crm.opportunity.create", "crm.opportunity.update",
    "crm.activity.view", "crm.activity.create", "crm.activity.update",
    "sales.quotation.view", "sales.quotation.create", "sales.quotation.update",
    "sales.sale_order.view", "sales.sale_order.create", "sales.sale_order.update",
    "sales.ar_invoice.view",
    "sales.ar_receipt.view",
    "sales.return.view", "sales.return.create",
    "master.partner.view", "master.partner.create",
    "master.product.view", "master.uom.view", "master.tax.view", "master.payment_term.view",
  ],

  // WHMANAGER: quản lý kho
  WHMANAGER: [
    "inventory.warehouse.view", "inventory.warehouse.create", "inventory.warehouse.update",
    "inventory.stock_move.view", "inventory.stock_move.create", "inventory.stock_move.approve",
    "inventory.stock_balance.view", "inventory.stock_balance.export",
    "inventory.physical.view", "inventory.physical.create", "inventory.physical.approve",
    "master.product.view", "master.uom.view",
    "reports.inventory.view", "reports.inventory.export",
  ],

  // WHSTAFF: nhân viên kho
  WHSTAFF: [
    "inventory.warehouse.view",
    "inventory.stock_move.view", "inventory.stock_move.create",
    "inventory.stock_balance.view",
    "inventory.physical.view", "inventory.physical.create",
    "master.product.view", "master.uom.view",
    "reports.inventory.view",
  ],

  // CHACC: kế toán trưởng — toàn quyền finance
  CHACC: [
    "finance.gl_account.view", "finance.gl_account.create", "finance.gl_account.update", "finance.gl_account.delete",
    "finance.gl_entry.view", "finance.gl_entry.create", "finance.gl_entry.approve",
    "finance.report.view", "finance.report.export",
    "finance.fiscal.view", "finance.fiscal.update",
    "sales.ar_invoice.view", "sales.ar_invoice.create", "sales.ar_invoice.approve", "sales.ar_invoice.export",
    "sales.ar_receipt.view", "sales.ar_receipt.create", "sales.ar_receipt.approve",
    "purchase.ap_invoice.view", "purchase.ap_invoice.create", "purchase.ap_invoice.approve",
    "purchase.ap_payment.view", "purchase.ap_payment.create", "purchase.ap_payment.approve",
    "master.partner.view", "master.tax.view", "master.payment_term.view",
    "master.currency.view", "master.currency.update",
    "reports.inventory.view", "reports.sales.view", "reports.purchase.view",
    "reports.ocr.view",
  ],

  // ACCOUNT: kế toán viên
  ACCOUNT: [
    "finance.gl_account.view",
    "finance.gl_entry.view", "finance.gl_entry.create",
    "finance.report.view", "finance.fiscal.view",
    "sales.ar_invoice.view", "sales.ar_invoice.create",
    "sales.ar_receipt.view", "sales.ar_receipt.create",
    "purchase.ap_invoice.view", "purchase.ap_invoice.create",
    "purchase.ap_payment.view", "purchase.ap_payment.create",
    "master.partner.view", "master.tax.view", "master.payment_term.view", "master.currency.view",
    "reports.sales.view", "reports.purchase.view",
  ],

  // HRMANAGER: quản lý nhân sự
  HRMANAGER: [
    "hrm.employee.view", "hrm.employee.create", "hrm.employee.update", "hrm.employee.delete",
    "hrm.department.view", "hrm.department.create", "hrm.department.update",
    "hrm.position.view", "hrm.position.create", "hrm.position.update",
    "hrm.attendance.view", "hrm.attendance.create", "hrm.attendance.update",
    "hrm.leave_request.view", "hrm.leave_request.create", "hrm.leave_request.approve",
    "hrm.payroll.view", "hrm.payroll.create", "hrm.payroll.approve", "hrm.payroll.export",
    "auth.user.view",
  ],

  // PURCHASEMANAGER: quản lý mua hàng
  PURCHASEMANAGER: [
    "purchase.rfq.view", "purchase.rfq.create", "purchase.rfq.update",
    "purchase.purchase_order.view", "purchase.purchase_order.create",
    "purchase.purchase_order.update", "purchase.purchase_order.approve", "purchase.purchase_order.delete",
    "purchase.ap_invoice.view", "purchase.ap_invoice.create", "purchase.ap_invoice.approve",
    "purchase.ap_payment.view", "purchase.ap_payment.create", "purchase.ap_payment.approve",
    "purchase.return.view", "purchase.return.create", "purchase.return.approve",
    "master.partner.view", "master.partner.create", "master.partner.update",
    "master.product.view", "master.uom.view", "master.tax.view", "master.payment_term.view",
    "reports.purchase.view",
  ],

  // PURCHASE: nhân viên mua hàng
  PURCHASE: [
    "purchase.rfq.view", "purchase.rfq.create", "purchase.rfq.update",
    "purchase.purchase_order.view", "purchase.purchase_order.create", "purchase.purchase_order.update",
    "purchase.ap_invoice.view", "purchase.ap_invoice.create",
    "purchase.ap_payment.view",
    "purchase.return.view", "purchase.return.create",
    "master.partner.view",
    "master.product.view", "master.uom.view", "master.tax.view", "master.payment_term.view",
  ],
};

// ── Helpers ─────────────────────────────────────────────
const now = new Date();

module.exports = {
  async up(queryInterface) {
    // 1. Insert roles (skip nếu đã tồn tại)
    const existingRoles = await queryInterface.sequelize.query(
      "SELECT code FROM roles",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const existingRoleCodes = new Set(existingRoles.map((r) => r.code));

    const newRoles = ROLES.filter((r) => !existingRoleCodes.has(r.code)).map((r) => ({
      ...r,
      created_at: now,
      updated_at: now,
    }));
    if (newRoles.length > 0) {
      await queryInterface.bulkInsert("roles", newRoles);
    }

    // 2. Insert permissions (skip nếu đã tồn tại)
    const existingPerms = await queryInterface.sequelize.query(
      "SELECT code FROM permissions",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const existingPermCodes = new Set(existingPerms.map((p) => p.code));

    const newPerms = PERMISSIONS.filter((p) => !existingPermCodes.has(p.code)).map((p) => ({
      ...p,
      created_at: now,
      updated_at: now,
    }));
    if (newPerms.length > 0) {
      await queryInterface.bulkInsert("permissions", newPerms);
    }

    // 3. Fetch fresh IDs sau khi insert
    const allRoles = await queryInterface.sequelize.query(
      "SELECT id, code FROM roles",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const roleMap = Object.fromEntries(allRoles.map((r) => [r.code, r.id]));

    const allPerms = await queryInterface.sequelize.query(
      "SELECT id, code FROM permissions",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const permMap = Object.fromEntries(allPerms.map((p) => [p.code, p.id]));

    // 4. Insert role_permissions (skip duplicates)
    const existingRP = await queryInterface.sequelize.query(
      "SELECT role_id, permission_id FROM role_permissions",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const existingRPSet = new Set(existingRP.map((rp) => `${rp.role_id}:${rp.permission_id}`));

    const rpRows = [];
    for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
      const roleId = roleMap[roleCode];
      if (!roleId) continue;
      for (const permCode of permCodes) {
        const permId = permMap[permCode];
        if (!permId) continue;
        const key = `${roleId}:${permId}`;
        if (!existingRPSet.has(key)) {
          rpRows.push({ role_id: roleId, permission_id: permId, created_at: now, updated_at: now });
          existingRPSet.add(key); // tránh trùng trong batch
        }
      }
    }

    if (rpRows.length > 0) {
      await queryInterface.bulkInsert("role_permissions", rpRows);
    }

    console.log(`✅ Seeded: ${newRoles.length} roles, ${newPerms.length} permissions, ${rpRows.length} role_permissions`);
  },

  async down(queryInterface) {
    const roleCodes = ROLES.map((r) => `'${r.code}'`).join(",");
    const permCodes = PERMISSIONS.map((p) => `'${p.code}'`).join(",");

    // Xóa role_permissions trước (FK)
    await queryInterface.sequelize.query(`
      DELETE rp FROM role_permissions rp
      INNER JOIN roles r ON r.id = rp.role_id
      WHERE r.code IN (${roleCodes})
    `);

    await queryInterface.sequelize.query(`
      DELETE FROM permissions WHERE code IN (${permCodes})
    `);

    // Không xóa roles vì có thể đang được dùng bởi users
    console.log("↩️  Rolled back: permissions & role_permissions removed");
  },
};
