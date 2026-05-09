"use strict";

const PERMISSIONS = [
  // ==================== SALES ====================
  { code: "sales.sale_order.view", name: "Xem đơn hàng", module: "sales", resource: "sale_orders", action: "view" },
  { code: "sales.sale_order.create", name: "Tạo đơn hàng", module: "sales", resource: "sale_orders", action: "create" },
  { code: "sales.sale_order.update", name: "Sửa đơn hàng", module: "sales", resource: "sale_orders", action: "update" },
  { code: "sales.sale_order.delete", name: "Xóa đơn hàng", module: "sales", resource: "sale_orders", action: "delete" },
  { code: "sales.sale_order.approve", name: "Duyệt đơn hàng", module: "sales", resource: "sale_orders", action: "approve" },
  { code: "sales.sale_order.export", name: "Xuất đơn hàng", module: "sales", resource: "sale_orders", action: "export" },

  // ==================== AR (Accounts Receivable) ====================
  { code: "ar.invoice.view", name: "Xem hóa đơn bán", module: "ar", resource: "ar_invoices", action: "view" },
  { code: "ar.invoice.create", name: "Tạo hóa đơn bán", module: "ar", resource: "ar_invoices", action: "create" },
  { code: "ar.invoice.update", name: "Sửa hóa đơn bán", module: "ar", resource: "ar_invoices", action: "update" },
  { code: "ar.invoice.approve", name: "Duyệt hóa đơn bán", module: "ar", resource: "ar_invoices", action: "approve" },
  { code: "ar.receipt.view", name: "Xem phiếu thu", module: "ar", resource: "ar_receipts", action: "view" },
  { code: "ar.receipt.create", name: "Tạo phiếu thu", module: "ar", resource: "ar_receipts", action: "create" },
  { code: "ar.receipt.update", name: "Sửa phiếu thu", module: "ar", resource: "ar_receipts", action: "update" },
  { code: "ar.receipt.approve", name: "Duyệt phiếu thu", module: "ar", resource: "ar_receipts", action: "approve" },

  // ==================== CRM ====================
  { code: "crm.lead.view", name: "Xem lead", module: "crm", resource: "crm_leads", action: "view" },
  { code: "crm.lead.create", name: "Tạo lead", module: "crm", resource: "crm_leads", action: "create" },
  { code: "crm.lead.update", name: "Sửa lead", module: "crm", resource: "crm_leads", action: "update" },
  { code: "crm.lead.delete", name: "Xóa lead", module: "crm", resource: "crm_leads", action: "delete" },
  { code: "crm.opportunity.view", name: "Xem cơ hội", module: "crm", resource: "crm_opportunities", action: "view" },
  { code: "crm.opportunity.create", name: "Tạo cơ hội", module: "crm", resource: "crm_opportunities", action: "create" },
  { code: "crm.opportunity.update", name: "Sửa cơ hội", module: "crm", resource: "crm_opportunities", action: "update" },
  { code: "crm.opportunity.delete", name: "Xóa cơ hội", module: "crm", resource: "crm_opportunities", action: "delete" },
  { code: "crm.activity.view", name: "Xem hoạt động CRM", module: "crm", resource: "crm_activities", action: "view" },
  { code: "crm.activity.create", name: "Tạo hoạt động CRM", module: "crm", resource: "crm_activities", action: "create" },

  // ==================== INVENTORY ====================
  { code: "inventory.stock_move.view", name: "Xem phiếu kho", module: "inventory", resource: "stock_moves", action: "view" },
  { code: "inventory.stock_move.create", name: "Tạo phiếu kho", module: "inventory", resource: "stock_moves", action: "create" },
  { code: "inventory.stock_move.update", name: "Sửa phiếu kho", module: "inventory", resource: "stock_moves", action: "update" },
  { code: "inventory.stock_move.approve", name: "Duyệt phiếu kho", module: "inventory", resource: "stock_moves", action: "approve" },
  { code: "inventory.warehouse.view", name: "Xem kho", module: "inventory", resource: "warehouses", action: "view" },
  { code: "inventory.warehouse.create", name: "Tạo kho", module: "inventory", resource: "warehouses", action: "create" },
  { code: "inventory.physical_inventory.view", name: "Xem kiểm kê", module: "inventory", resource: "physical_inventories", action: "view" },
  { code: "inventory.physical_inventory.create", name: "Tạo kiểm kê", module: "inventory", resource: "physical_inventories", action: "create" },

  // ==================== PURCHASE ====================
  { code: "purchase.po.view", name: "Xem đơn mua hàng", module: "purchase", resource: "purchase_orders", action: "view" },
  { code: "purchase.po.create", name: "Tạo đơn mua hàng", module: "purchase", resource: "purchase_orders", action: "create" },
  { code: "purchase.po.update", name: "Sửa đơn mua hàng", module: "purchase", resource: "purchase_orders", action: "update" },
  { code: "purchase.po.approve", name: "Duyệt đơn mua hàng", module: "purchase", resource: "purchase_orders", action: "approve" },
  { code: "ap.invoice.view", name: "Xem hóa đơn mua", module: "ap", resource: "ap_invoices", action: "view" },
  { code: "ap.invoice.create", name: "Tạo hóa đơn mua", module: "ap", resource: "ap_invoices", action: "create" },
  { code: "ap.invoice.approve", name: "Duyệt hóa đơn mua", module: "ap", resource: "ap_invoices", action: "approve" },
  { code: "ap.payment.view", name: "Xem phiếu chi", module: "ap", resource: "ap_payments", action: "view" },
  { code: "ap.payment.create", name: "Tạo phiếu chi", module: "ap", resource: "ap_payments", action: "create" },
  { code: "ap.payment.approve", name: "Duyệt phiếu chi", module: "ap", resource: "ap_payments", action: "approve" },

  // ==================== FINANCE ====================
  { code: "finance.gl_account.view", name: "Xem tài khoản kế toán", module: "finance", resource: "gl_accounts", action: "view" },
  { code: "finance.gl_account.create", name: "Tạo tài khoản kế toán", module: "finance", resource: "gl_accounts", action: "create" },
  { code: "finance.gl_account.update", name: "Sửa tài khoản kế toán", module: "finance", resource: "gl_accounts", action: "update" },
  { code: "finance.gl_account.delete", name: "Xóa tài khoản kế toán", module: "finance", resource: "gl_accounts", action: "delete" },
  { code: "finance.gl_journal.view", name: "Xem sổ nhật ký", module: "finance", resource: "gl_journals", action: "view" },
  { code: "finance.gl_entry.view", name: "Xem bút toán", module: "finance", resource: "gl_entries", action: "view" },

  // ==================== HRM ====================
  { code: "hrm.employee.view", name: "Xem nhân viên", module: "hrm", resource: "employees", action: "view" },
  { code: "hrm.employee.create", name: "Tạo nhân viên", module: "hrm", resource: "employees", action: "create" },
  { code: "hrm.employee.update", name: "Sửa nhân viên", module: "hrm", resource: "employees", action: "update" },
  { code: "hrm.attendance.view", name: "Xem chấm công", module: "hrm", resource: "attendances", action: "view" },
  { code: "hrm.attendance.create", name: "Chấm công", module: "hrm", resource: "attendances", action: "create" },
  { code: "hrm.payroll.view", name: "Xem bảng lương", module: "hrm", resource: "payroll_runs", action: "view" },
  { code: "hrm.payroll.create", name: "Tạo bảng lương", module: "hrm", resource: "payroll_runs", action: "create" },
  { code: "hrm.payroll.approve", name: "Duyệt bảng lương", module: "hrm", resource: "payroll_runs", action: "approve" },

  // ==================== PARTNER ====================
  { code: "partner.view", name: "Xem đối tác", module: "partner", resource: "partners", action: "view" },
  { code: "partner.create", name: "Tạo đối tác", module: "partner", resource: "partners", action: "create" },
  { code: "partner.update", name: "Sửa đối tác", module: "partner", resource: "partners", action: "update" },
  { code: "partner.delete", name: "Xóa đối tác", module: "partner", resource: "partners", action: "delete" },

  // ==================== PRODUCT ====================
  { code: "product.view", name: "Xem sản phẩm", module: "product", resource: "products", action: "view" },
  { code: "product.create", name: "Tạo sản phẩm", module: "product", resource: "products", action: "create" },
  { code: "product.update", name: "Sửa sản phẩm", module: "product", resource: "products", action: "update" },
  { code: "product.delete", name: "Xóa sản phẩm", module: "product", resource: "products", action: "delete" },

  // ==================== ADMIN ====================
  { code: "admin.user.view", name: "Xem tài khoản", module: "admin", resource: "users", action: "view" },
  { code: "admin.user.create", name: "Tạo tài khoản", module: "admin", resource: "users", action: "create" },
  { code: "admin.user.update", name: "Sửa tài khoản", module: "admin", resource: "users", action: "update" },
  { code: "admin.user.delete", name: "Xóa tài khoản", module: "admin", resource: "users", action: "delete" },
  { code: "admin.role.view", name: "Xem vai trò", module: "admin", resource: "roles", action: "view" },
  { code: "admin.role.create", name: "Tạo vai trò", module: "admin", resource: "roles", action: "create" },
  { code: "admin.role.update", name: "Sửa vai trò", module: "admin", resource: "roles", action: "update" },
  { code: "admin.permission.view", name: "Xem phân quyền", module: "admin", resource: "permissions", action: "view" },
  { code: "admin.permission.update", name: "Cấu hình phân quyền", module: "admin", resource: "permissions", action: "update" },

  // ==================== MASTER DATA ====================
  { code: "master_data.currency.view", name: "Xem tiền tệ", module: "master_data", resource: "currencies", action: "view" },
  { code: "master_data.uom.view", name: "Xem đơn vị tính", module: "master_data", resource: "uoms", action: "view" },
  { code: "master_data.tax_rate.view", name: "Xem thuế suất", module: "master_data", resource: "tax_rates", action: "view" },

  // ==================== REPORT ====================
  { code: "report.sales.view", name: "Xem báo cáo bán hàng", module: "report", resource: "reports", action: "view" },
  { code: "report.finance.view", name: "Xem báo cáo tài chính", module: "report", resource: "reports", action: "view" },
  { code: "report.inventory.view", name: "Xem báo cáo kho", module: "report", resource: "reports", action: "view" },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = PERMISSIONS.map((p) => ({
      ...p,
      created_at: now,
      updated_at: now,
    }));
    await queryInterface.bulkInsert("permissions", rows, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("permissions", null, {});
  },
};
