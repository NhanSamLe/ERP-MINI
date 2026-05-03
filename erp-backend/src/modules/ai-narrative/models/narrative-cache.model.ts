import { DataTypes, Model, Sequelize } from "sequelize";

export class NarrativeCache extends Model {
  public id!: number;
  public companyId!: number;
  public narrativeType!: string;
  public periodStart!: Date;
  public periodEnd!: Date;
  public dataHash!: string;
  public narrativeText!: string;
  public metadata!: Record<string, any>;
  public ttlExpiresAt!: Date;
  public readonly createdAt!: Date;
}

export function initNarrativeCacheModel(
  sequelize: Sequelize,
): typeof NarrativeCache {
  NarrativeCache.init(
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
        type: DataTypes.STRING(50),
        allowNull: false,
        field: "narrative_type",
      },
      periodStart: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "period_start",
      },
      periodEnd: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "period_end",
      },
      dataHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: "data_hash",
      },
      narrativeText: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
        field: "narrative_text",
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      ttlExpiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "ttl_expires_at",
      },
    },
    {
      sequelize,
      tableName: "ai_narrative_cache",
      timestamps: true,
      underscored: true,
      updatedAt: false,
    },
  );

  return NarrativeCache;
}
