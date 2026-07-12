import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Separator } from "@/components/ui/separator";
import {
  Phone,
  Mail,
  Building2,
  User,
  Briefcase,
  BadgeDollarSign,
  CalendarDays,
  Percent,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Lead } from "../dto/lead.dto";
import { Opportunity } from "../dto/opportunity.dto";
import { Partner } from "../../partner/store/partner.types";
import { formatVND } from "@/utils/currency.helper";

interface Props {
  relatedType: "lead" | "opportunity" | "customer";
  lead?: Lead | null;
  opportunity?: Opportunity | null;
  customer?: Partner | null;
}

const OPPORTUNITY_STAGE_LABELS: Record<string, string> = {
  prospecting: "Tiếp cận",
  negotiation: "Đàm phán",
  won: "Đã thắng",
  lost: "Đã thất bại",
};

export function RelatedInfoCard({ relatedType, lead, opportunity, customer }: Props) {
  // -------------------------------------------------------
  // CASE 1: LEAD
  // -------------------------------------------------------
  if (relatedType === "lead" && lead) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-lg font-semibold">Khách hàng tiềm năng</CardTitle>
          <User className="w-5 h-5 text-gray-500" />
        </CardHeader>

        <Separator />

        <CardContent className="pt-4 space-y-3 text-sm text-gray-700">
          <Link
            to={`/crm/leads/${lead.id}`}
            className="font-medium text-base text-blue-600 hover:underline"
          >
            {lead.name}
          </Link>

          {lead.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" /> {lead.phone}
            </div>
          )}

          {lead.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" /> {lead.email}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // -------------------------------------------------------
  // CASE 2: CUSTOMER
  // -------------------------------------------------------
  if (relatedType === "customer" && customer) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-lg font-semibold">Khách hàng</CardTitle>
          <Building2 className="w-5 h-5 text-gray-500" />
        </CardHeader>

        <Separator />

        <CardContent className="pt-4 space-y-3 text-sm text-gray-700">
          <Link
            to={`/partners/${customer.id}`}
            className="font-medium text-base text-blue-600 hover:underline"
          >
            {customer.name}
          </Link>
          {customer.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" /> {customer.phone}
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" /> {customer.email}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // -------------------------------------------------------
  // CASE 3: OPPORTUNITY — FULL CARD
  // -------------------------------------------------------
  if (relatedType === "opportunity" && opportunity) {
    const opp = opportunity;

    const customerObj = opp.customer || null;
    const leadObj = opp.lead || null;

    return (
      <Card className="border border-gray-200 shadow-sm">
        {/* ----------------- HEADER ------------------- */}
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-lg font-semibold">Cơ hội kinh doanh</CardTitle>
          <Briefcase className="w-5 h-5 text-gray-500" />
        </CardHeader>

        <Separator />

        {/* ----------------- OPPORTUNITY INFO ------------------- */}
        <CardContent className="pt-4 pb-4 space-y-4 text-sm text-gray-700">

          {/* Name (link) */}
          <Link
            to={`/crm/opportunities/${opp.id}`}
            className="font-medium text-base text-blue-600 hover:underline"
          >
            {opp.name || "Cơ hội kinh doanh"}
          </Link>

          {/* Stage */}
          {opp.stage && (
            <div className="flex items-center gap-2">
              <BadgeDollarSign className="w-4 h-4" />
              Giai đoạn: <span className="font-medium">{OPPORTUNITY_STAGE_LABELS[opp.stage] || opp.stage}</span>
            </div>
          )}

          {/* Value */}
          {opp.expected_value && (
            <div className="flex items-center gap-2">
              <BadgeDollarSign className="w-4 h-4" />
              Giá trị:{" "}
              <span className="font-medium">
                {opp.currency?.code && opp.currency.code !== "VND"
                  ? `${Number(opp.expected_value).toLocaleString("vi-VN")} ${opp.currency.symbol || opp.currency.code}`
                  : formatVND(opp.expected_value)}
              </span>
            </div>
          )}

          {/* Expected close date */}
          {opp.closing_date && (
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Ngày dự kiến chốt:{" "}
              <span className="font-medium">
                {new Date(opp.closing_date).toLocaleDateString("vi-VN")}
              </span>
            </div>
          )}

          {/* Probability */}
          {opp.probability != null && (
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Xác suất:{" "}
              <span className="font-medium">{Math.round(opp.probability)}%</span>
            </div>
          )}

          <Separator className="my-2" />

          {/* ----------------- Customer or Lead ------------------- */}

          {customerObj && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase">Khách hàng</p>
              <Link
                className="font-medium text-blue-600 hover:underline"
                to={`/partners/${customerObj.id}`}
              >
                {customerObj.name}
              </Link>

              {customerObj.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  {customerObj.phone}
                </div>
              )}
              {customerObj.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  {customerObj.email}
                </div>
              )}
            </div>
          )}

          {leadObj && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase">Khách hàng tiềm năng</p>
              <Link
                className="font-medium text-blue-600 hover:underline"
                to={`/crm/leads/${leadObj.id}`}
              >
                {leadObj.name}
              </Link>

              {leadObj.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  {leadObj.phone}
                </div>
              )}
              {leadObj.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  {leadObj.email}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
