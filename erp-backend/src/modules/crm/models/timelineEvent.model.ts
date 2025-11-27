import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface TimelineEventAttrs {
  id: number;
  related_type: "lead" | "opportunity" | "customer";
  related_id: number;
  event_type: string;        // vd: lead_created, stage_changed, opp_won
  title: string;             // tiêu đề ngắn
  description?: string | null;
  created_by?: number | null;
  created_at: Date;
}

type TimelineEventCreation = Optional<TimelineEventAttrs, "id" | "created_at">;

export class TimelineEvent
  extends Model<TimelineEventAttrs, TimelineEventCreation>
  implements TimelineEventAttrs
{
  public id!: number;
  public related_type!: "lead" | "opportunity" | "customer";
  public related_id!: number;

  public event_type!: string;
  public title!: string;
  public description?: string | null;

  public created_by?: number | null;
  public created_at!: Date;
}

TimelineEvent.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

    related_type: {
      type: DataTypes.ENUM("lead", "opportunity", "customer"),
      allowNull: false,
    },

    related_id: { type: DataTypes.BIGINT, allowNull: false },

    event_type: { type: DataTypes.STRING(50), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },

    created_by: { type: DataTypes.BIGINT, allowNull: true },

    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: "crm_timeline_events",
    updatedAt: false,
    createdAt: "created_at",
  }
);
