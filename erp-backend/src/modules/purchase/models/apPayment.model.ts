import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface ApPaymentAttrs {
  id: number;
  payment_no: string;
  supplier_id?: number;
  payment_date?: Date;
  amount?: number;
  method: "cash" | "bank" | "transfer";
  status: "draft" | "posted";
}

type ApPaymentCreation = Optional<ApPaymentAttrs, "id" | "status">;

export class ApPayment extends Model<ApPaymentAttrs, ApPaymentCreation>
  implements ApPaymentAttrs {
  public id!: number;
  public payment_no!: string;
  public supplier_id?: number;
  public payment_date?: Date;
  public amount?: number;
  public method!: "cash" | "bank" | "transfer";
  public status!: "draft" | "posted";
}

ApPayment.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    payment_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    supplier_id: { type: DataTypes.BIGINT },
    payment_date: { type: DataTypes.DATE },
    amount: { type: DataTypes.DECIMAL(18,2) },
    method: { type: DataTypes.ENUM("cash","bank","transfer"), allowNull: false },
    status: { type: DataTypes.ENUM("draft","posted"), defaultValue: "draft" },
  },
  { sequelize, tableName: "ap_payments", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
