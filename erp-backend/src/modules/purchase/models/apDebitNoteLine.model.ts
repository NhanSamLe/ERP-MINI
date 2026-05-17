import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface ApDebitNoteLineAttrs {
  id: number;
  debit_note_id: number;
  product_id?: number | null;
  return_line_id?: number | null;
  description?: string | null;
  quantity: number;
  unit_price: number;
  tax_rate_id?: number | null;
  line_total: number;
  line_tax: number;
  line_total_after_tax: number;
}

type ApDebitNoteLineCreation = Optional<
  ApDebitNoteLineAttrs,
  "id" | "line_total" | "line_tax" | "line_total_after_tax"
>;

export class ApDebitNoteLine
  extends Model<ApDebitNoteLineAttrs, ApDebitNoteLineCreation>
  implements ApDebitNoteLineAttrs
{
  public id!: number;
  public debit_note_id!: number;
  public product_id?: number | null;
  public return_line_id?: number | null;
  public description?: string | null;
  public quantity!: number;
  public unit_price!: number;
  public tax_rate_id?: number | null;
  public line_total!: number;
  public line_tax!: number;
  public line_total_after_tax!: number;
}

ApDebitNoteLine.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    debit_note_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT, allowNull: true },
    return_line_id: { type: DataTypes.BIGINT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    quantity: { type: DataTypes.DECIMAL(18, 3), allowNull: false },
    unit_price: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
    tax_rate_id: { type: DataTypes.BIGINT, allowNull: true },
    line_total: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    line_tax: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    line_total_after_tax: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "ap_debit_note_lines",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
