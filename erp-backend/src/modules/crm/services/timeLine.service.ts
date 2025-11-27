import { TimelineEvent } from "../models/timelineEvent.model"; 
export async function addTimeline({
  related_type,
  related_id,
  event_type,
  title,
  description,
  created_by
}: {
  related_type: "lead" | "opportunity" | "customer";
  related_id: number;
  event_type: string;
  title: string;
  description?: string;
  created_by?: number;
}) {
  await TimelineEvent.create({
    related_type,
    related_id,
    event_type,
    title,
    description: description ?? null,
    created_by: created_by ?? null,
  });
}

export async function getTimelineByType(
  related_type: "lead" | "opportunity" | "customer",
  related_id: number,
  options?: { limit?: number; offset?: number }
) {
  const { limit = 50, offset = 0 } = options ?? {};

  return TimelineEvent.findAll({
    where: {
      related_type,
      related_id,
    },
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });
}
