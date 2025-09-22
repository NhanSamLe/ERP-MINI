import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface ApInvoiceAttrs {
  id: number;
  po_id?: number;
  invoice_no: string;
  invoice_date?: Date;
  due_date?: Date;
  total_before_tax?: number;
  total_tax?: number;
  total_after_tax?: number;
  status: "draft" | "posted" | "paid" | "cancelled";
}

type ApInvoiceCreation = Optional<ApInvoiceAttrs, "id" | "status">;

export class ApInvoice extends Model<ApInvoiceAttrs, ApInvoiceCreation>
  implements ApInvoiceAttrs {
  public id!: number;
  public po_id?: number;
  public invoice_no!: string;
  public invoice_date?: Date;
  public due_date?: Date;
  public total_before_tax?: number;
  public total_tax?: number;
  public total_after_tax?: number;
  public status!: "draft" | "posted" | "paid" | "cancelled";
}

ApInvoice.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    po_id: { type: DataTypes.BIGINT },
    invoice_no: { type: DataTypes.STRING(50), allowNull: false },
    invoice_date: { type: DataTypes.DATE },
    due_date: { type: DataTypes.DATE },
    total_before_tax: { type: DataTypes.DECIMAL(18,2) },
    total_tax: { type: DataTypes.DECIMAL(18,2) },
    total_after_tax: { type: DataTypes.DECIMAL(18,2) },
    status: {
      type: DataTypes.ENUM("draft","posted","paid","cancelled"),
      defaultValue: "draft",
    },
  },
  { sequelize, tableName: "ap_invoices", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
