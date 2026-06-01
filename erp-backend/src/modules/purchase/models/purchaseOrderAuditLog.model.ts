import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface PurchaseOrderAuditLogAttrs {
  id: number;
  po_id: number;
  action: "CREATE" | "UPDATE" | "APPROVE" | "CANCEL";
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  changed_by: number;
  changed_at: Date;
  branch_id: number;
}

type PurchaseOrderAuditLogCreation = Optional<
  PurchaseOrderAuditLogAttrs,
  "id" | "changed_at"
>;

export class PurchaseOrderAuditLog
  extends Model<PurchaseOrderAuditLogAttrs, PurchaseOrderAuditLogCreation>
  implements PurchaseOrderAuditLogAttrs
{
  public id!: number;
  public po_id!: number;
  public action!: "CREATE" | "UPDATE" | "APPROVE" | "CANCEL";
  public old_values?: Record<string, any> | null;
  public new_values?: Record<string, any> | null;
  public changed_by!: number;
  public changed_at!: Date;
  public branch_id!: number;
}

PurchaseOrderAuditLog.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    po_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM("CREATE", "UPDATE", "APPROVE", "CANCEL"),
      allowNull: false,
    },
    old_values: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    new_values: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    changed_by: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    changed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    branch_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "po_audit_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

// Define associations
PurchaseOrderAuditLog.associate = (models: any) => {
  PurchaseOrderAuditLog.belongsTo(models.User, {
    foreignKey: "changed_by",
    as: "changedByUser",
  });
  PurchaseOrderAuditLog.belongsTo(models.PurchaseOrder, {
    foreignKey: "po_id",
    as: "purchaseOrder",
  });
};
