import {
  Card,
  CardHeader,
  CardContent
} from "../../../components/ui/Card";
import { Separator } from "../../../components/ui/separator"; 

export function MetricCard({
  icon,
  title,
  value,
  color
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className={`bg-gradient-to-br ${color} shadow`}>
      <CardHeader className="flex items-center gap-3">
        {icon}
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 text-3xl font-bold text-gray-900">
        {value}
      </CardContent>
    </Card>
  );
}
