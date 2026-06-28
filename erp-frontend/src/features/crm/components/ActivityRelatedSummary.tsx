import { Building2, BriefcaseBusiness, Mail, Phone, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Activity } from "../dto/activity.dto";

const RELATED_META = {
  lead: {
    label: "Khách hàng tiềm năng",
    icon: UserRound,
    path: (id: number) => `/crm/leads/${id}`,
  },
  opportunity: {
    label: "Cơ hội kinh doanh",
    icon: BriefcaseBusiness,
    path: (id: number) => `/crm/opportunities/${id}`,
  },
  customer: {
    label: "Khách hàng",
    icon: Building2,
    path: (id: number) => `/partners/${id}`,
  },
} as const;

export function ActivityRelatedSummary({ activity }: { activity: Activity }) {
  const meta = RELATED_META[activity.related_type];
  const Icon = meta.icon;
  let related: { id: number; name?: string | null } | null | undefined;
  let phone: string | null | undefined;
  let email: string | null | undefined;

  if (activity.related_type === "lead") {
    related = activity.lead;
    phone = activity.lead?.phone;
    email = activity.lead?.email;
  } else if (activity.related_type === "opportunity") {
    related = activity.opportunity;
    phone = activity.opportunity?.customer?.phone || activity.opportunity?.lead?.phone;
    email = activity.opportunity?.customer?.email || activity.opportunity?.lead?.email;
  } else {
    related = activity.customer;
    phone = activity.customer?.phone;
    email = activity.customer?.email;
  }

  if (!related) {
    return <p className="text-sm text-gray-500">Không tìm thấy thông tin liên kết.</p>;
  }

  return (
    <div className="space-y-2 text-sm">
      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
        <Icon className="h-3.5 w-3.5" />
        {meta.label}
      </p>
      <Link
        to={meta.path(related.id)}
        className="block font-semibold text-orange-600 hover:text-orange-700 hover:underline"
      >
        {related.name || "Chưa có tên"}
      </Link>
      {phone && (
        <p className="flex items-center gap-2 text-gray-700">
          <Phone className="h-3.5 w-3.5 text-gray-400" />
          {phone}
        </p>
      )}
      {email && (
        <p className="flex items-center gap-2 break-all text-gray-700">
          <Mail className="h-3.5 w-3.5 text-gray-400" />
          {email}
        </p>
      )}
    </div>
  );
}
