import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface ArReceiptAllocationAttrs {
  id: number;
  receipt_id: number;
  invoice_id: number;
  applied_amount?: number;
}

type ArReceiptAllocationCreation = Optional<ArReceiptAllocationAttrs, "id">;

export class ArReceiptAllocation extends Model<ArReceiptAllocationAttrs, ArReceiptAllocationCreation>
  implements ArReceiptAllocationAttrs {
  public id!: number;
  public receipt_id!: number;
  public invoice_id!: number;
  public applied_amount?: number;
}

ArReceiptAllocation.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    receipt_id: { type: DataTypes.BIGINT, allowNull: false },
    invoice_id: { type: DataTypes.BIGINT, allowNull: false },
    applied_amount: { type: DataTypes.DECIMAL(18,2) },
  },
  { sequelize, tableName: "ar_receipt_allocations", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
