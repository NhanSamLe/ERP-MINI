import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface AnomalyThresholdConfigAttrs {
  id: number;
  branch_id: number;
  z_score_threshold: number;
  iqr_multiplier: number;
  frequency_threshold_per_hour: number;
  approval_threshold_vnd: number;
  high_risk_score_threshold: number;
  medium_risk_score_threshold: number;
  created_by: number;
  updated_by: number;
  created_at?: Date;
  updated_at?: Date;
}

type AnomalyThresholdConfigCreation = Optional<
  AnomalyThresholdConfigAttrs,
  "id"
>;

export class AnomalyThresholdConfig
  extends Model<AnomalyThresholdConfigAttrs, AnomalyThresholdConfigCreation>
  implements AnomalyThresholdConfigAttrs
{
  public id!: number;
  public branch_id!: number;
  public z_score_threshold!: number;
  public iqr_multiplier!: number;
  public frequency_threshold_per_hour!: number;
  public approval_threshold_vnd!: number;
  public high_risk_score_threshold!: number;
  public medium_risk_score_threshold!: number;
  public created_by!: number;
  public updated_by!: number;
  public created_at?: Date;
  public updated_at?: Date;
}

AnomalyThresholdConfig.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    branch_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    z_score_threshold: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 3.0,
    },
    iqr_multiplier: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.5,
    },
    frequency_threshold_per_hour: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    approval_threshold_vnd: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    high_risk_score_threshold: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.7,
    },
    medium_risk_score_threshold: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.4,
    },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    updated_by: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    tableName: "anomaly_threshold_configs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
