import { sequelize } from "../config/db";
// Auth
import { User } from "../modules/auth/models/user.model";
import { Role } from "../modules/auth/models/role.model";
// Company
import { Company } from "../modules/company/models/company.model";
import { Branch } from "../modules/company/models/branch.model";
// Product
import { Product } from "../modules/product/models/product.model";
import { ProductCategory } from "../modules/product/models/productCategory.model";
// Master Data
import { Uom } from "../modules/master-data/models/uom.model";
import { UomConversion } from "../modules/master-data/models/uomConversion.model";
import { Currency } from "../modules/master-data/models/currency.model";
import { ExchangeRate } from "../modules/master-data/models/exchangeRate.model";
import { TaxRate } from "../modules/master-data/models/taxRate.model";
// Customer , Partner
import { Partner } from "../modules/partner/models/partner.model";
// CRM
import { Lead } from "../modules/crm/models/lead.model";
import { Opportunity } from "../modules/crm/models/opportunity.model";
import { Activity } from "../modules/crm/models/activity.model";
// Sales & AR
import { SaleOrder } from "../modules/sales/models/saleOrder.model";
import { SaleOrderLine } from "../modules/sales/models/saleOrderLine.model";
import { ArInvoice } from "../modules/sales/models/arInvoice.model";
import { ArInvoiceLine } from "../modules/sales/models/arInvoiceLine.model";
import { ArReceipt } from "../modules/sales/models/arReceipt.model";
import { ArReceiptAllocation } from "../modules/sales/models/arReceiptAllocation.model";
// Purchase & AP
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
// HRM
import { Department } from "../modules/hrm/models/department.model";
import { Position } from "../modules/hrm/models/position.model";
import { Employee } from "../modules/hrm/models/employee.model";
import { PayrollPeriod } from "../modules/hrm/models/payrollPeriod.model";
import { PayrollRun } from "../modules/hrm/models/payrollRun.model";
import { PayrollRunLine } from "../modules/hrm/models/payrollRunLine.model";
// Finance & GL
import { GlAccount } from "../modules/finance/models/glAccount.model";
import { GlJournal } from "../modules/finance/models/glJournal.model";
import { GlEntry } from "../modules/finance/models/glEntry.model";
import { GlEntryLine } from "../modules/finance/models/glEntryLine.model";
// Associations
import { applyAssociations } from "./associations";
import { CallActivity } from "../modules/crm/models/callActivity.model";
import { MeetingActivity } from "../modules/crm/models/meetingActivity.model";
import { TaskActivity } from "../modules/crm/models/taskActivity.model";
import { EmailActivity } from "../modules/crm/models/emailActivity.model";
import { TimelineEvent } from "../modules/crm/models/timelineEvent.model";
applyAssociations();
import { Attendance } from "../modules/hrm/models/attendance.model";
import { PayrollItem } from "../modules/hrm/models/payrollItem.model";
import { Notification } from "../core/models/notification.model";

export {
  sequelize,
  User, Role,
  Company, Branch,
  Product, ProductCategory,
  Uom, UomConversion,
  Currency, ExchangeRate,
  TaxRate,
  Partner, Lead, Opportunity, Activity,
  SaleOrder, SaleOrderLine, ArInvoice, ArInvoiceLine, ArReceipt, ArReceiptAllocation,
  PurchaseOrder, PurchaseOrderLine, ApInvoice, ApInvoiceLine, ApPayment, ApPaymentAllocation,
  Warehouse, StockMove, StockMoveLine, StockBalance,
  Department, Position, Employee, PayrollPeriod, PayrollRun, PayrollRunLine,
  GlAccount, GlJournal, GlEntry, GlEntryLine, CallActivity, MeetingActivity, TaskActivity, EmailActivity, Attendance, PayrollItem,
  Notification,
};
