import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface GlEntryLineAttrs {
  id: number;
  entry_id: number;
  account_id: number;
  partner_id?: number;
  debit: number;
  credit: number;
}

type GlEntryLineCreation = Optional<GlEntryLineAttrs, "id" | "partner_id" | "debit" | "credit">;

export class GlEntryLine extends Model<GlEntryLineAttrs, GlEntryLineCreation> implements GlEntryLineAttrs {
  public id!: number;
  public entry_id!: number;
  public account_id!: number;
  public partner_id?: number;
  public debit!: number;
  public credit!: number;
}

GlEntryLine.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    entry_id: { type: DataTypes.BIGINT, allowNull: false },
    account_id: { type: DataTypes.BIGINT, allowNull: false },
    partner_id: { type: DataTypes.BIGINT },
    debit: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
    credit: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0 },
  },
  { sequelize, tableName: "gl_entry_lines", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
