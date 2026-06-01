import { sequelize } from "../config/db";
// Auth
import { User } from "../modules/auth/models/user.model";
import { Role } from "../modules/auth/models/role.model";
import { Permission } from "../modules/auth/models/permission.model";
import { RolePermission } from "../modules/auth/models/rolePermission.model";
import { UserRole } from "../modules/auth/models/userRole.model";
// Company
import { Company } from "../modules/company/models/company.model";
import { Branch } from "../modules/company/models/branch.model";
// Product
import { Product } from "../modules/product/models/product.model";
import { ProductCategory } from "../modules/product/models/productCategory.model";
import { ProductSupplierInfo } from "../modules/product/models/productSupplierInfo.model";
// Master Data
import { Uom } from "../modules/master-data/models/uom.model";
import { UomConversion } from "../modules/master-data/models/uomConversion.model";
import { Currency } from "../modules/master-data/models/currency.model";
import { ExchangeRate } from "../modules/master-data/models/exchangeRate.model";
import { TaxRate } from "../modules/master-data/models/taxRate.model";
import { PaymentTerm } from "../modules/master-data/models/paymentTerm.model";
import { BankAccount } from "../modules/master-data/models/bankAccount.model";
// Customer, Partner
import { Partner } from "../modules/partner/models/partner.model";
// CRM
import { Lead } from "../modules/crm/models/lead.model";
import { Opportunity } from "../modules/crm/models/opportunity.model";
import { Activity } from "../modules/crm/models/activity.model";
import { CallActivity } from "../modules/crm/models/callActivity.model";
import { MeetingActivity } from "../modules/crm/models/meetingActivity.model";
import { TaskActivity } from "../modules/crm/models/taskActivity.model";
import { EmailActivity } from "../modules/crm/models/emailActivity.model";
import { TimelineEvent } from "../modules/crm/models/timelineEvent.model";
import { LeadSource } from "../modules/crm/models/leadSource.model";
import { Pipeline } from "../modules/crm/models/pipeline.model";
import { PipelineStage } from "../modules/crm/models/pipelineStage.model";
import { ScoringRule } from "../modules/crm/models/scoringRule.model";
// Sales & AR
import { SaleOrder } from "../modules/sales/models/saleOrder.model";
import { SaleOrderLine } from "../modules/sales/models/saleOrderLine.model";
import { ArInvoice } from "../modules/sales/models/arInvoice.model";
import { ArInvoiceLine } from "../modules/sales/models/arInvoiceLine.model";
import { ArReceipt } from "../modules/sales/models/arReceipt.model";
import { ArReceiptAllocation } from "../modules/sales/models/arReceiptAllocation.model";
import { Quotation } from "../modules/sales/models/quotation.model";
import { QuotationLine } from "../modules/sales/models/quotationLine.model";
import { PriceList } from "../modules/sales/models/priceList.model";
import { PriceListItem } from "../modules/sales/models/priceListItem.model";
import { SalesReturnAuthorization } from "../modules/sales/models/salesReturnAuthorization.model";
import { SalesReturn } from "../modules/sales/models/salesReturn.model";
import { SalesReturnLine } from "../modules/sales/models/salesReturnLine.model";
import { ArCreditNote } from "../modules/sales/models/arCreditNote.model";
import { ArCreditNoteLine } from "../modules/sales/models/arCreditNoteLine.model";
import { ArRefund } from "../modules/sales/models/arRefund.model";
// Purchase & AP
import { PurchaseOrder } from "../modules/purchase/models/purchaseOrder.model";
import { PurchaseOrderLine } from "../modules/purchase/models/purchaseOrderLine.model";
import { ApInvoice } from "../modules/purchase/models/apInvoice.model";
import { ApInvoiceLine } from "../modules/purchase/models/apInvoiceLine.model";
import { ApPayment } from "../modules/purchase/models/apPayment.model";
import { ApPaymentAllocation } from "../modules/purchase/models/apPaymentAllocation.model";
import { ApPaymentAuditLog } from "../modules/purchase/models/apPaymentAuditLog.model";
// Inventory
import { Warehouse } from "../modules/inventory/models/warehouse.model";
import { StockMove } from "../modules/inventory/models/stockMove.model";
import { StockMoveLine } from "../modules/inventory/models/stockMoveLine.model";
import { StockBalance } from "../modules/inventory/models/stockBalance.model";
import { StockLocation } from "../modules/inventory/models/stockLocation.model";
import { StockLot } from "../modules/inventory/models/stockLot.model";
import { PhysicalInventory } from "../modules/inventory/models/physicalInventory.model";
import { PhysicalInventoryLine } from "../modules/inventory/models/physicalInventoryLine.model";
// HRM
import { Department } from "../modules/hrm/models/department.model";
import { Position } from "../modules/hrm/models/position.model";
import { Employee } from "../modules/hrm/models/employee.model";
import { PayrollPeriod } from "../modules/hrm/models/payrollPeriod.model";
import { PayrollRun } from "../modules/hrm/models/payrollRun.model";
import { PayrollRunLine } from "../modules/hrm/models/payrollRunLine.model";
import { Attendance } from "../modules/hrm/models/attendance.model";
import { PayrollItem } from "../modules/hrm/models/payrollItem.model";
// Finance & GL
import { GlAccount } from "../modules/finance/models/glAccount.model";
import { GlJournal } from "../modules/finance/models/glJournal.model";
import { GlEntry } from "../modules/finance/models/glEntry.model";
import { GlEntryLine } from "../modules/finance/models/glEntryLine.model";
import { FiscalYear } from "../modules/finance/models/fiscalYear.model";
import { FiscalPeriod } from "../modules/finance/models/fiscalPeriod.model";
// Core
import { Notification } from "../core/models/notification.model";
// AI Chatbot
import { Conversation } from "../modules/ai-chatbot/models/conversation.model";
import { ChatMessage } from "../modules/ai-chatbot/models/message.model";
// Document Intelligence
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
// Associations
import { applyAssociations } from "./associations";

applyAssociations();

// Auto RAG Synchronization Hooks
import { syncService } from "../modules/ai/services/sync.service";

function registerAutoSyncHooks() {
  const handleAutoSync = async (instance: any) => {
    try {
      const modelName = instance.constructor.name;
      const entityId = instance.id;
      if (!entityId) return;

      console.log(`[Auto-Sync Hook] Model ${modelName} changed. ID: ${entityId}`);

      if (modelName === "Product") {
        syncService.syncOne("inventory", "product", entityId).catch((err) => {
          console.error(`[Auto-Sync] Error syncing Product ID ${entityId}:`, err);
        });
      } else if (modelName === "Lead") {
        syncService.syncOne("crm", "lead", entityId).catch((err) => {
          console.error(`[Auto-Sync] Error syncing Lead ID ${entityId}:`, err);
        });
      } else if (modelName === "PurchaseOrder") {
        syncService.syncOne("purchase", "purchase_order", entityId).catch((err) => {
          console.error(`[Auto-Sync] Error syncing PurchaseOrder ID ${entityId}:`, err);
        });
      } else if (modelName === "SaleOrder") {
        syncService.syncOne("sale", "sale_order", entityId).catch((err) => {
          console.error(`[Auto-Sync] Error syncing SaleOrder ID ${entityId}:`, err);
        });
      } else if (modelName === "Partner") {
        if (instance.is_customer || instance.type === "customer") {
          syncService.syncOne("crm", "customer", entityId).catch((err) => {
            console.error(`[Auto-Sync] Error syncing Customer ID ${entityId}:`, err);
          });
        }
        if (instance.is_supplier || instance.type === "supplier") {
          syncService.syncOne("purchase", "vendor", entityId).catch((err) => {
            console.error(`[Auto-Sync] Error syncing Vendor ID ${entityId}:`, err);
          });
        }
      }
    } catch (err) {
      console.error("[Auto-Sync Hook Global Error]:", err);
    }
  };

  const modelsToHook: any[] = [Product, Lead, PurchaseOrder, SaleOrder, Partner];
  for (const model of modelsToHook) {
    model.addHook("afterCreate", "autoSyncAfterCreate", handleAutoSync);
    model.addHook("afterUpdate", "autoSyncAfterUpdate", handleAutoSync);
  }
}

registerAutoSyncHooks();

export {
  sequelize,
  User,
  Role,
  Permission,
  RolePermission,
  UserRole,
  Company,
  Branch,
  Product,
  ProductCategory,
  ProductSupplierInfo,
  Uom,
  UomConversion,
  Currency,
  ExchangeRate,
  TaxRate,
  Partner,
  Lead,
  Opportunity,
  Activity,
  CallActivity,
  MeetingActivity,
  TaskActivity,
  EmailActivity,
  TimelineEvent,
  SaleOrder,
  SaleOrderLine,
  ArInvoice,
  ArInvoiceLine,
  ArReceipt,
  ArReceiptAllocation,
  PurchaseOrder,
  PurchaseOrderLine,
  ApInvoice,
  ApInvoiceLine,
  ApPayment,
  ApPaymentAllocation,
  ApPaymentAuditLog,
  Warehouse,
  StockMove,
  StockMoveLine,
  StockBalance,
  StockLocation,
  StockLot,
  PhysicalInventory,
  PhysicalInventoryLine,
  Department,
  Position,
  Employee,
  PayrollPeriod,
  PayrollRun,
  PayrollRunLine,
  Attendance,
  PayrollItem,
  GlAccount,
  GlJournal,
  GlEntry,
  GlEntryLine,
  FiscalYear,
  FiscalPeriod,
  PaymentTerm,
  BankAccount,
  // Phase 2: CRM
  LeadSource,
  Pipeline,
  PipelineStage,
  ScoringRule,
  // Phase 3: Quotation + PriceList
  Quotation,
  QuotationLine,
  PriceList,
  PriceListItem,
  // Phase 4: Sales Return + Credit Notes
  SalesReturnAuthorization,
  SalesReturn,
  SalesReturnLine,
  ArCreditNote,
  ArCreditNoteLine,
  ArRefund,
  Notification,
  Conversation,
  ChatMessage,
  InvoiceDocument,
  OcrFieldMapping,
  // Phase 5: Purchase Enhancement
  PurchaseRfq,
  PurchaseRfqLine,
  PurchaseReturnAuthorization,
  PurchaseReturn,
  PurchaseReturnLine,
  ApDebitNote,
  ApDebitNoteLine,
  VendorRefund,
  PurchasePriceList,
  PurchasePriceListItem,
};
