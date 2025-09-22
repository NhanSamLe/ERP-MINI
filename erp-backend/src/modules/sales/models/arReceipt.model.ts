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
  },
  { sequelize, tableName: "ar_receipts", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
