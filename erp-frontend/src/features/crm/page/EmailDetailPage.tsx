// src/features/crm/pages/EmailDetailPage.tsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  getActivityDetail,
  deleteActivity,
  sendEmailForActivity,
  cancelEmailActivity,
} from "../service/activity.service";
import {ActivityMetaInfoCard} from "../components/ActivityMetaInfoCard"
import { Activity } from "../dto/activity.dto";
import { OwnerInfoCard } from "../components/OwnerInfoCard";
import { Button } from "@/components/ui/buttonn";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  ArrowLeft,
  Mail,
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Trash2,
  Send,
} from "lucide-react";

import { RelatedInfoCard } from "../components/RelatedInfoCard";

export default function EmailDetailPage() {
  const { id } = useParams();
  const emailId = Number(id);
  const navigate = useNavigate();

  const [detail, setDetail] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ----------------------------------------------
  // LOAD DETAIL
  // ----------------------------------------------
  useEffect(() => {
    loadDetail();
  }, [emailId]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const res = await getActivityDetail(emailId);
      setDetail(res);
    } catch (err) {
      setAlert({
        type: "error",
        message: err instanceof Error ? err.message : "Unable to load email",
      });
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------
  // ACTIONS
  // ----------------------------------------------

  const handleResend = async () => {
    if (!window.confirm("Resend this email?")) return;
    try {
      await sendEmailForActivity(emailId);
      setAlert({ type: "success", message: "Email sent successfully." });
      loadDetail();
    } catch (err) {
      setAlert({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to send email",
      });
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this email?")) return;
    try {
      await cancelEmailActivity(emailId);
      setAlert({ type: "success", message: "Email has been cancelled." });
      loadDetail();
    } catch {
      setAlert({ type: "error", message: "Unable to cancel email" });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this email? This cannot be undone.")) return;
    try {
      await deleteActivity(emailId);
      navigate("/crm/activities/email");
    } catch {
      setAlert({ type: "error", message: "Unable to delete email" });
    }
  };

  // ----------------------------------------------

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!detail || !detail.email) return <div className="p-8 text-center">Email not found</div>;

  const email = detail.email;
  const isOutbound = email.direction === "out";

  const canResend =
    !!email.html_body &&
    detail.status !== "completed" &&
    detail.status !== "cancelled";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Mail
                className={`w-6 h-6 ${
                  isOutbound ? "text-blue-500" : "text-green-500"
                }`}
              />
              {detail.subject || "Email"}
            </h1>

            {/* Direction */}
            <span
              className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 ${
                isOutbound ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
              }`}
            >
              {isOutbound ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
              {isOutbound ? "Outbound" : "Inbound"}
            </span>

            {/* Status */}
            <span
              className={`px-3 py-1 text-xs rounded-full ${
                detail.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : detail.status === "cancelled"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {detail.status}
            </span>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-2">

            {canResend && (
              <Button size="sm" variant="outline" onClick={handleResend}>
                <Send className="w-4 h-4 mr-1" />
                Send Email
              </Button>
            )}

  

            {detail.status !== "completed" && detail.status !== "cancelled" && (
              <Button size="sm" onClick={handleCancel}>
                Cancel
              </Button>
            )}
         {detail.status !== "completed" && detail.status !== "cancelled" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                navigate(`/crm/activities/email/${emailId}/edit`)
              }
            >
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Button>
          )}
            <Button size="sm" variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {alert && (
          <div className="lg:col-span-3">
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">

          {/* EMAIL INFO */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Email Details</h2>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-4 py-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">From</p>
                  <p className="font-medium">{email.email_from}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">To</p>
                  <p className="font-medium">{email.email_to}</p>
                </div>

                {email.cc && (
                  <div>
                    <p className="text-sm text-gray-500">CC</p>
                    <p className="font-medium">{email.cc}</p>
                  </div>
                )}

                {email.bcc && (
                  <div>
                    <p className="text-sm text-gray-500">BCC</p>
                    <p className="font-medium">{email.bcc}</p>
                  </div>
                )}

                {email.message_id && (
                  <div>
                    <p className="text-sm text-gray-500">Message ID</p>
                    <p className="font-medium break-all">{email.message_id}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* EMAIL CONTENT */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Content</h2>
            </CardHeader>
            <Separator />
            <CardContent className="py-4">
              {email.html_body ? (
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: email.html_body }}
                />
              ) : (
                <pre className="text-gray-700 whitespace-pre-line">
                  {email.text_body || "No content"}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">

          {/* RELATED */}
          <RelatedInfoCard
            relatedType={detail.related_type}
            lead={detail.lead}
            opportunity={detail.opportunity}
            customer={detail.customer}
          />
          <OwnerInfoCard
              fullName={detail.owner?.full_name}
              email={detail.owner?.email}
              phone={detail.owner?.phone}
            />
          {/* INFO */}
          <ActivityMetaInfoCard
            createdAt={detail.created_at}
            updatedAt={detail.updated_at}
            completedAt={detail.completed_at}
          />

        </div>
      </div>
    </div>
  );
}
