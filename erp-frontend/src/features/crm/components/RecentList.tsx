import {
  Card,
  CardHeader,
  CardContent
} from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";

export function RecentList<T>({
  title,
  items,
  getLabel,
  getDate,
}: {
  title: string;
  items: T[];
  getLabel: (item: T) => string;
  getDate: (item: T) => string | Date | undefined;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">{title}</h2>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 space-y-3">

        {items.length === 0 && (
          <p className="text-gray-500 text-center py-4 text-sm">Empty</p>
        )}

        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3 border border-gray-200 rounded-lg hover:bg-orange-50 transition"
          >
            <p className="font-semibold text-gray-800">{getLabel(item)}</p>

            <p className="text-xs text-gray-500 mt-1">
              {getDate(item)
                ? new Date(getDate(item)!).toLocaleString("vi-VN")
                : ""}
            </p>
          </div>
        ))}

      </CardContent>
    </Card>
  );
}