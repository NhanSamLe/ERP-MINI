import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

interface Props {
  relatedType: "lead" | "opportunity" | "customer";
  lead?: Lead | null;
  opportunity?: Opportunity | null;
  customer?: Partner | null;
}

export function RelatedInfoCard({ relatedType, lead, opportunity, customer }: Props) {
  // -------------------------------------------------------
  // CASE 1: LEAD
  // -------------------------------------------------------
  if (relatedType === "lead" && lead) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-lg font-semibold">Lead</CardTitle>
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
          <CardTitle className="text-lg font-semibold">Customer</CardTitle>
          <Building2 className="w-5 h-5 text-gray-500" />
        </CardHeader>

        <Separator />

        <CardContent className="pt-4 space-y-3 text-sm text-gray-700">
          <Link
            to={`/crm/customers/${customer.id}`}
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
          <CardTitle className="text-lg font-semibold">Opportunity</CardTitle>
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
            {opp.name || "Opportunity"}
          </Link>

          {/* Stage */}
          {opp.stage && (
            <div className="flex items-center gap-2">
              <BadgeDollarSign className="w-4 h-4" />
              Stage: <span className="font-medium">{opp.stage}</span>
            </div>
          )}

          {/* Value */}
          {opp.expected_value && (
            <div className="flex items-center gap-2">
              <BadgeDollarSign className="w-4 h-4" />
              Value: <span className="font-medium">${opp.expected_value}</span>
            </div>
          )}

          {/* Expected close date */}
          {opp.closing_date && (
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Close date:{" "}
              <span className="font-medium">{opp.closing_date}</span>
            </div>
          )}

          {/* Probability */}
          {opp.probability && (
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Probability:{" "}
              <span className="font-medium">{opp.probability}%</span>
            </div>
          )}

          <Separator className="my-2" />

          {/* ----------------- Customer or Lead ------------------- */}

          {customerObj && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase">Customer</p>
              <Link
                className="font-medium text-blue-600 hover:underline"
                to={`/crm/customers/${customerObj.id}`}
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
              <p className="text-xs text-gray-500 uppercase">Lead</p>
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
