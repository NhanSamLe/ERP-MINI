// src/features/crm/components/RelatedInfoCard.tsx

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, Building2, User } from "lucide-react";
import { ReactNode } from "react";
import { Lead } from "../dto/lead.dto";
import { Opportunity } from "../dto/opportunity.dto";
import { Partner } from "../../partner/dtos/partner.dto";

interface Props {
  relatedType: "lead" | "opportunity" | "customer";
  lead?: Lead | null;
  opportunity?: Opportunity | null;
  customer?: Partner | null;
}

export function RelatedInfoCard({ relatedType, lead, opportunity, customer }: Props) {
  let title = "";
  let infoName = "";
  let phone = "";
  let email = "";
  let icon: ReactNode = null;


  // =======================================================
  // RULE: priority partner → lead → customer
  // =======================================================

  if (relatedType === "lead" && lead) {
    title = "Lead";
    infoName = lead.name || "Lead không tên";
    phone = lead.phone || "";
    email = lead.email || "";
    icon = <User className="w-5 h-5 text-gray-500" />;
  }

  if (relatedType === "opportunity" && opportunity) {
    // إذا Opportunity có Partner → dùng Partner
    if (opportunity.customer) {
      const p: Partner = opportunity.customer;
      title = "Khách hàng (Partner)";
      infoName = p.name || "Khách hàng";
      phone = p.phone || "";
      email = p.email || "";
      icon = <Building2 className="w-5 h-5 text-gray-500" />;
    } else if (opportunity.lead) {
      const l: Lead = opportunity.lead;
      title = "Lead liên quan";
      infoName = l.name;
      phone = l.phone || "";
      email = l.email || "";
      icon = <User className="w-5 h-5 text-gray-500" />;
    }
  }

  if (relatedType === "customer" && customer) {
    const p = customer;
    title = "Khách hàng (Partner)";
    infoName = p.name;
    phone = p.phone || "";
    email = p.email || "";
    icon = <Building2 className="w-5 h-5 text-gray-500" />;
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {icon}
      </CardHeader>

      <Separator />

      <CardContent className="pt-4 space-y-3 text-sm text-gray-700">

        <div className="font-medium text-base">{infoName}</div>

        {phone && (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4" /> {phone}
          </div>
        )}

        {email && (
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4" /> {email}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
