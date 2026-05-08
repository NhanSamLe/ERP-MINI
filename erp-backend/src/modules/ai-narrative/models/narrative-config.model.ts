import { DataTypes, Model, Sequelize } from "sequelize";

export class NarrativeConfig extends Model {
  public id!: number;
  public companyId!: number;
  public narrativeType!:
    | "monthly_report"
    | "sales_performance"
    | "vendor_performance"
    | "cash_flow";
  public templateName!: string;
  public promptTemplate!: string;
  public tone!: "formal" | "casual" | "analytical";
  public language!: string;
  public maxTokens!: number;
  public temperature!: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initNarrativeConfigModel(
  sequelize: Sequelize,
): typeof NarrativeConfig {
  NarrativeConfig.init(
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
      narrativeType: {
        type: DataTypes.ENUM(
          "monthly_report",
          "sales_performance",
          "vendor_performance",
          "cash_flow",
        ),
        allowNull: false,
        field: "narrative_type",
      },
      templateName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "template_name",
      },
      promptTemplate: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
        field: "prompt_template",
      },
      tone: {
        type: DataTypes.ENUM("formal", "casual", "analytical"),
        defaultValue: "analytical",
      },
      language: {
        type: DataTypes.STRING(10),
        defaultValue: "vi",
      },
      maxTokens: {
        type: DataTypes.INTEGER,
        defaultValue: 500,
        field: "max_tokens",
      },
      temperature: {
        type: DataTypes.FLOAT,
        defaultValue: 0.7,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_active",
      },
    },
    {
      sequelize,
      tableName: "ai_narrative_configs",
      timestamps: true,
      underscored: true,
    },
  );

  return NarrativeConfig;
}
