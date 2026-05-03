import { DataTypes, Model, Sequelize } from "sequelize";

export class NarrativeLog extends Model {
  public id!: number;
  public companyId!: number;
  public userId!: number;
  public narrativeType!: string;
  public periodStart!: Date | null;
  public periodEnd!: Date | null;
  public inputData!: Record<string, any> | null;
  public outputNarrative!: string | null;
  public tokensUsed!: number | null;
  public costUsd!: number | null;
  public generationTimeMs!: number | null;
  public status!: "success" | "failed" | "partial";
  public errorMessage!: string | null;
  public readonly createdAt!: Date;
}

export function initNarrativeLogModel(
  sequelize: Sequelize,
): typeof NarrativeLog {
  NarrativeLog.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "company_id",
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_id",
      },
      narrativeType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: "narrative_type",
      },
      periodStart: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "period_start",
      },
      periodEnd: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "period_end",
      },
      inputData: {
        type: DataTypes.JSON,
        allowNull: true,
        field: "input_data",
      },
      outputNarrative: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
        field: "output_narrative",
      },
      tokensUsed: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "tokens_used",
      },
      costUsd: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
        field: "cost_usd",
      },
      generationTimeMs: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "generation_time_ms",
      },
      status: {
        type: DataTypes.ENUM("success", "failed", "partial"),
        defaultValue: "success",
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "error_message",
      },
    },
    {
      sequelize,
      tableName: "ai_narrative_logs",
      timestamps: true,
      underscored: true,
      updatedAt: false,
    },
  );

  return NarrativeLog;
}
