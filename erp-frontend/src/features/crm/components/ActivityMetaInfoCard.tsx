import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Separator } from "@/components/ui/separator";
import { Clock } from "lucide-react";
import { formatDateTime } from "@/utils/time.helper";

interface Props {
  createdAt?: string | null;
  updatedAt?: string | null;
  completedAt?: string | null;
}

export function ActivityMetaInfoCard({ createdAt, updatedAt, completedAt }: Props) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-lg font-semibold">Information</CardTitle>
        <Clock className="w-5 h-5 text-gray-500" />
      </CardHeader>

      <Separator />

      <CardContent className="pt-4 space-y-3 text-sm text-gray-700">

        {/* Created */}
        <div className="flex justify-between">
          <span>Created</span>
          <span className="font-medium">
            {createdAt ? formatDateTime(createdAt) : "—"}
          </span>
        </div>

        {/* Updated */}
        <div className="flex justify-between">
          <span>Updated</span>
          <span className="font-medium">
            {updatedAt ? formatDateTime(updatedAt) : "—"}
          </span>
        </div>

        {/* Completed */}
        {completedAt && (
          <div className="flex justify-between text-green-700">
            <span>Completed</span>
            <span className="font-medium">{formatDateTime(completedAt)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
