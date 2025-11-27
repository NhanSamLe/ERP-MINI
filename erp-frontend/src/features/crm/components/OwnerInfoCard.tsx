// src/features/crm/components/OwnerInfoCard.tsx

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Phone, Mail } from "lucide-react";

interface Props {
  fullName?: string;
  email?: string;
  phone?: string;
}

export function OwnerInfoCard({ fullName, email, phone }: Props) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-lg font-semibold">Owner</CardTitle>
        <User className="w-5 h-5 text-gray-500" />
      </CardHeader>

      <Separator />

      <CardContent className="pt-4 space-y-3 text-sm text-gray-700">

        {/* NAME */}
        <div className="font-medium text-base">
          {fullName || "Unknown owner"}
        </div>

        {/* EMAIL */}
        {email && (
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4" /> {email}
          </div>
        )}

        {/* PHONE */}
        {phone && (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4" /> {phone}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
