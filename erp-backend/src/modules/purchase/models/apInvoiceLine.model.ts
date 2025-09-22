import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface ApInvoiceLineAttrs {
  id: number;
  ap_invoice_id: number;
  product_id?: number;
  description?: string;
  quantity?: number;
  unit_price?: number;
  tax_rate_id?: number;
  line_total?: number;
}

type ApInvoiceLineCreation = Optional<ApInvoiceLineAttrs, "id">;

export class ApInvoiceLine extends Model<ApInvoiceLineAttrs, ApInvoiceLineCreation>
  implements ApInvoiceLineAttrs {
  public id!: number;
  public ap_invoice_id!: number;
  public product_id?: number;
  public description?: string;
  public quantity?: number;
  public unit_price?: number;
  public tax_rate_id?: number;
  public line_total?: number;
}

ApInvoiceLine.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    ap_invoice_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT },
    description: { type: DataTypes.STRING(255) },
    quantity: { type: DataTypes.DECIMAL(18,3) },
    unit_price: { type: DataTypes.DECIMAL(18,2) },
    tax_rate_id: { type: DataTypes.BIGINT },
    line_total: { type: DataTypes.DECIMAL(18,2) },
  },
  { sequelize, tableName: "ap_invoice_lines", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
