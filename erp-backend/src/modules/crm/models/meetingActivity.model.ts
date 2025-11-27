import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config/db";

export interface MeetingActivityAttrs {
  id: number;
  activity_id: number;
  start_at?: Date | null;
  end_at?: Date | null;
  location?: string | null;
  attendees?: string | null; // JSON string
  meeting_link?: string | null;
  reminder_at?: Date | null;
  cancelled_at?: Date | null;
  meeting_notes?: string | null;
}

type MeetingActivityCreation = Optional<MeetingActivityAttrs, "id">;

export class MeetingActivity
  extends Model<MeetingActivityAttrs, MeetingActivityCreation>
  implements MeetingActivityAttrs
{
  public id!: number;
  public activity_id!: number;
  public start_at?: Date | null;
  public end_at?: Date | null;
  public location?: string | null;
  public attendees?: string | null;
  public meeting_link?: string | null;
  public reminder_at?: Date | null;
  public cancelled_at?: Date | null;
  public meeting_notes?: string | null;
}

MeetingActivity.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    activity_id: { type: DataTypes.BIGINT, allowNull: false },
    start_at: { type: DataTypes.DATE },
    end_at: { type: DataTypes.DATE },
    location: { type: DataTypes.STRING(255) },
    attendees: { type: DataTypes.TEXT },
    meeting_link: { type: DataTypes.STRING(255) },
    reminder_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    meeting_notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: "crm_activity_meetings",
    timestamps: false,
  }
);
