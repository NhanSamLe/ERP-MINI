import { Activity } from "../dto/activity.dto";
import { Calendar } from "lucide-react";

export default function ActivityCardMini({
  a,
  onClick,
}: {
  a: Activity;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="p-3 border rounded-lg hover:bg-orange-50 hover:border-orange-400 cursor-pointer transition"
    >
      <div className="text-sm font-semibold text-gray-700">
        {a.subject ?? "(No subject)"}
      </div>

      {a.notes && (
        <div className="text-xs text-gray-500 mt-1 truncate">{a.notes}</div>
      )}

      {a.due_at && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
          <Calendar className="w-3 h-3" />
          {new Date(a.due_at).toLocaleDateString("vi-VN")}
        </div>
      )}
    </div>
  );
}
