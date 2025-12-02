import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface ArReceiptAttrs {
  id: number;
  receipt_no: string;
  customer_id?: number;
  receipt_date?: Date;
  amount?: number;
  method: "cash" | "bank" | "transfer";
  status: "draft" | "posted";
  approval_status: "draft" | "waiting_approval" | "approved" | "rejected";
  created_by: number;
  approved_by?: number | null;
  submitted_at?: Date | null;
  approved_at?: Date | null;
  reject_reason?: string | null;
  branch_id: number; 
}

type ArReceiptCreation = Optional<ArReceiptAttrs, "id" | "status">;

export class ArReceipt extends Model<ArReceiptAttrs, ArReceiptCreation> implements ArReceiptAttrs {
  public id!: number;
  public receipt_no!: string;
  public customer_id?: number;
  public receipt_date?: Date;
  public amount?: number;
  public method!: "cash" | "bank" | "transfer";
  public status!: "draft" | "posted";
  public approval_status!: "draft" | "waiting_approval" | "approved" | "rejected";
  public created_by!: number;
  public approved_by?: number | null;
  public submitted_at?: Date | null;
  public approved_at?: Date | null;
  public reject_reason?: string | null;
  public branch_id!: number; 
}

ArReceipt.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    receipt_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    customer_id: { type: DataTypes.BIGINT },
    receipt_date: { type: DataTypes.DATE },
    amount: { type: DataTypes.DECIMAL(18,2) },
    method: { type: DataTypes.ENUM("cash","bank","transfer"), allowNull: false },
    status: { type: DataTypes.ENUM("draft","posted"), defaultValue: "draft" },
     approval_status: {
      type: DataTypes.ENUM("draft", "waiting_approval", "approved", "rejected"),
      defaultValue: "draft",
    },
    created_by: { type: DataTypes.BIGINT, allowNull: false },
    approved_by: { type: DataTypes.BIGINT },
    submitted_at: { type: DataTypes.DATE },
    approved_at: { type: DataTypes.DATE },
    reject_reason: { type: DataTypes.STRING(255) },
    branch_id: { type: DataTypes.BIGINT, allowNull: false },
  },
  { sequelize, tableName: "ar_receipts", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);

