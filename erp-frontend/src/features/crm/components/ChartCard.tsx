import {
  Card,
  CardHeader,
  CardContent
} from "../../../components/ui/Card";
import { Separator } from "../../../components/ui/separator";

export function ChartCard({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">{title}</h2>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}
