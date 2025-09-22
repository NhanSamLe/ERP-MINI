import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface ApPaymentAllocationAttrs {
  id: number;
  payment_id: number;
  ap_invoice_id: number;
  applied_amount?: number;
}

type ApPaymentAllocationCreation = Optional<ApPaymentAllocationAttrs, "id">;

export class ApPaymentAllocation extends Model<ApPaymentAllocationAttrs, ApPaymentAllocationCreation>
  implements ApPaymentAllocationAttrs {
  public id!: number;
  public payment_id!: number;
  public ap_invoice_id!: number;
  public applied_amount?: number;
}

ApPaymentAllocation.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    payment_id: { type: DataTypes.BIGINT, allowNull: false },
    ap_invoice_id: { type: DataTypes.BIGINT, allowNull: false },
    applied_amount: { type: DataTypes.DECIMAL(18,2) },
  },
  { sequelize, tableName: "ap_payment_allocations", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
