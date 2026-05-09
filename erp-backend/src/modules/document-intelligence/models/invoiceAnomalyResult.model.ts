import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";
import type { AnomalyFlag } from "../types/anomaly.types";
import { InvoiceDocument } from "./invoiceDocument.model";

export interface InvoiceAnomalyResultAttrs {
  id: number;
  document_id: number;
  risk_score: number;
  risk_level: "low_risk" | "medium_risk" | "high_risk";
  flags: AnomalyFlag[];
  math_consistent: boolean;
  skipped_reasons: string[];
  analysis_duration_ms?: number | null;
  analyzed_at: Date;
  override_by?: number | null;
  override_at?: Date | null;
  created_at?: Date;
}

type InvoiceAnomalyResultCreation = Optional<
  InvoiceAnomalyResultAttrs,
  "id" | "analysis_duration_ms" | "override_by" | "override_at"
>;

export class InvoiceAnomalyResult
  extends Model<InvoiceAnomalyResultAttrs, InvoiceAnomalyResultCreation>
  implements InvoiceAnomalyResultAttrs
{
  public id!: number;
  public document_id!: number;
  public risk_score!: number;
  public risk_level!: "low_risk" | "medium_risk" | "high_risk";
  public flags!: AnomalyFlag[];
  public math_consistent!: boolean;
  public skipped_reasons!: string[];
  public analysis_duration_ms?: number | null;
  public analyzed_at!: Date;
  public override_by?: number | null;
  public override_at?: Date | null;
  public created_at?: Date;
}

InvoiceAnomalyResult.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    document_id: { type: DataTypes.BIGINT, allowNull: false },
    risk_score: { type: DataTypes.FLOAT, allowNull: false },
    risk_level: {
      type: DataTypes.ENUM("low_risk", "medium_risk", "high_risk"),
      allowNull: false,
    },
    flags: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    math_consistent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    skipped_reasons: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    analysis_duration_ms: { type: DataTypes.INTEGER, allowNull: true },
    analyzed_at: { type: DataTypes.DATE, allowNull: false },
    override_by: { type: DataTypes.INTEGER, allowNull: true },
    override_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "invoice_anomaly_results",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

// Association: each anomaly result belongs to one invoice document
InvoiceAnomalyResult.belongsTo(InvoiceDocument, {
  foreignKey: "document_id",
  as: "document",
});
