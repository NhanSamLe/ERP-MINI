import { Activity } from "../dto/activity.dto";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Separator } from "@/components/ui/separator";
import ActivityCardMini from "./ActivityCardMini";

export default function ActivityBoard({
  title,
  activities,
  onClick,
}: {
  title: string;
  activities: Activity[];
  onClick: (a: Activity) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="px-2 py-1 bg-gray-200 rounded text-sm">
          {activities.length}
        </span>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 space-y-3">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center">No activities</p>
        ) : (
          activities.map((a) => (
            <ActivityCardMini key={a.id} a={a} onClick={() => onClick(a)} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
