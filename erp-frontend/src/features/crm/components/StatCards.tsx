import { Activity } from "../dto/activity.dto";

export default function StatCards({ activities }: { activities: Activity[] }) {
  const stats = activities.reduce(
    (acc, a) => {
      if (a.activity_type in acc) acc[a.activity_type as keyof typeof acc]++;
      return acc;
    },
    {
      call: 0,
      email: 0,
      meeting: 0,
      task: 0,
    }
  );

  return (
    <div className="grid grid-cols-4 gap-3 px-1">
      <Tile label="Calls" value={stats.call} color="text-blue-600" />
      <Tile label="Emails" value={stats.email} color="text-purple-600" />
      <Tile label="Meetings" value={stats.meeting} color="text-green-600" />
      <Tile label="Tasks" value={stats.task} color="text-orange-600" />
    </div>
  );
}

function Tile({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="p-3 border rounded-xl bg-white flex gap-2 items-center shadow-sm">
      <span className={`font-bold ${color}`}>{value}</span>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}
