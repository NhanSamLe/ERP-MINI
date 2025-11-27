import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";

import {
  fetchOpportunityDetail,
  moveToNegotiation,
  markLost,
  markWon,
  deleteOpportunity,
} from "../store/opportunity/opportunity.thunks";

import * as activityService from "../service/activity.service";

import { Activity, TimelineEvent } from "../dto/activity.dto";

import { Card, CardHeader, CardContent } from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";
import { Alert } from "../../../components/ui/Alert";

import ActivityBoard from "../components/ActivityBoard";
import {CompactTimeline }from "../components/TimelineCard";
import InfoItem from "../components/InfoItem";
import OppStageActions from "../components/OppStageActions";
import StatCards from "../components/StatCards";

import { ArrowLeft, User, ChevronRight } from "lucide-react";

export default function OppDetailPage() {
  const { id } = useParams();
  const oppId = Number(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  /** 🔥 Correct reducer: opportunity.slice.ts uses `detail` */
  const opp = useAppSelector((s) => s.opportunity.detail);

  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  // --------------------------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------------------------
  useEffect(() => {
    dispatch(fetchOpportunityDetail(oppId));
    loadActivities();
    loadTimeline();
  }, [oppId]);

  const loadActivities = async () => {
    try {
      const res = await activityService.getActivitiesFor("opportunity", oppId);
      setActivities(res);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTimeline = async () => {
    try {
      const res = await activityService.getTimeline("opportunity", oppId);
      setTimeline(res);
    } catch (err) {
      console.error(err);
    }
  };

  if (!opp) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  // --------------------------------------------------------------------
  // ACTIVITY GROUPS
  // --------------------------------------------------------------------
  const openActivities = activities.filter(
    (a) => a.status === "pending" || a.status === "in_progress"
  );

  const closedActivities = activities.filter(
    (a) => a.status === "completed" || a.status === "cancelled"
  );

  const getActivityUrl = (a: Activity) =>
    `/crm/activities/${a.activity_type}/${a.id}`;

  // --------------------------------------------------------------------
  // RELATED ENTITY PRIORITY
  // --------------------------------------------------------------------
  const relatedCustomer = opp.customer ?? null;
  const relatedLead = !relatedCustomer && opp.lead ? opp.lead : null;

  // --------------------------------------------------------------------
  // DELETE
  // --------------------------------------------------------------------
  const handleDelete = async () => {
    if (!confirm("Delete this opportunity?")) return;

    try {
      await dispatch(deleteOpportunity(oppId)).unwrap();
      navigate("/crm/opportunities");
    } catch {
      setAlert({
        type: "error",
        message: "Failed to delete opportunity",
      });
    }
  };

  // --------------------------------------------------------------------
  // RENDER PAGE
  // --------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ============================================================
            HEADER
        ============================================================ */}
        <div className="bg-white border rounded-xl shadow p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-xl font-bold text-orange-600">{opp.name}</h1>
              <p className="text-sm text-gray-500">Opportunity ID: {oppId}</p>
            </div>
          </div>

          <OppStageActions
            stage={opp.stage}
            onChangeStage={async (newStage) => {
              try {
                if (newStage === "negotiation") {
                  await dispatch(moveToNegotiation(oppId)).unwrap();
                } else if (newStage === "won") {
                  await dispatch(markWon(oppId)).unwrap();
                } else if (newStage === "lost") {
                  const reason = prompt("Reason for lost?");
                  if (!reason) return;
                  await dispatch(markLost({ oppId, reason })).unwrap();
                }

                dispatch(fetchOpportunityDetail(oppId));
              } catch {
                setAlert({
                  type: "error",
                  message: "Failed to update stage",
                });
              }
            }}
            onDelete={handleDelete}
          />
        </div>

        {/* ALERT */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* ============================================================
            MAIN 3-COLUMN LAYOUT
        ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT 2 COLUMNS */}
          <div className="lg:col-span-2 space-y-6">

            {/* BASIC INFO */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Basic Information</h2>
              </CardHeader>
              <Separator />
              <CardContent className="grid grid-cols-2 gap-6 pt-5">
                <InfoItem label="Name" value={opp.name} />

                <InfoItem
                  label="Expected Value"
                  value={
                    opp.expected_value
                      ? `${opp.expected_value.toLocaleString("vi-VN")} ₫`
                      : "-"
                  }
                />

                <InfoItem
                  label="Probability"
                  value={
                    opp.probability !== null && opp.probability !== undefined
                      ? `${opp.probability}%`
                      : "-"
                  }
                />

                <InfoItem
                  label="Closing Date"
                  value={
                    opp.closing_date
                      ? new Date(opp.closing_date).toLocaleDateString("vi-VN")
                      : "-"
                  }
                />
              </CardContent>
            </Card>

            {/* ========== ACTIVITIES SECTION ========== */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold px-1">Activities</h2>

              {/* STATISTICS */}
              <StatCards activities={activities} />

              {/* OPEN ACTIVITIES */}
              <div className="grid grid-cols-2 gap-4">
                <ActivityBoard
                  title="Open Activities"
                  activities={openActivities}
                  onClick={(a) => navigate(getActivityUrl(a))}
                />

                <ActivityBoard
                  title="Active Tasks"
                  activities={openActivities.filter(
                    (a) => a.activity_type === "task"
                  )}
                  onClick={(a) => navigate(getActivityUrl(a))}
                />
              </div>

              {/* CLOSED ACTIVITIES */}
              <div className="grid grid-cols-2 gap-4">
                <ActivityBoard
                  title="Completed"
                  activities={closedActivities.filter(
                    (a) => a.status === "completed"
                  )}
                  onClick={(a) => navigate(getActivityUrl(a))}
                />

                <ActivityBoard
                  title="Cancelled"
                  activities={closedActivities.filter(
                    (a) => a.status === "cancelled"
                  )}
                  onClick={(a) => navigate(getActivityUrl(a))}
                />
              </div>
            </div>

            {/* ========== TIMELINE ========== */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Timeline</h2>
              </CardHeader>
              <Separator />
              <CardContent className="pt-5">
                <CompactTimeline items={timeline} />
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">

            {/* OWNER */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Owner</h2>
              </CardHeader>
              <Separator />
              <CardContent className="pt-5">
                {opp.owner ? (
                  <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>

                    <div>
                      <p className="font-semibold">{opp.owner.full_name}</p>
                      <p className="text-sm text-gray-700">{opp.owner.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6">
                    Not assigned
                  </p>
                )}
              </CardContent>
            </Card>

            {/* RELATED ENTITY (FULL BLOCK) */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Related To</h2>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-4">

                {relatedCustomer && (
                  <button
                    onClick={() =>
                      navigate(`/crm/customers/${relatedCustomer.id}`)
                    }
                    className="w-full flex justify-between items-center p-4 border border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {relatedCustomer.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {relatedCustomer.phone ?? "No phone"}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                )}

                {!relatedCustomer && relatedLead && (
                  <button
                    onClick={() =>
                      navigate(`/crm/lead/${relatedLead.id}`)
                    }
                    className="w-full flex justify-between items-center p-4 border border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {relatedLead.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {relatedLead.email ?? "No email"}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                )}

                {!relatedCustomer && !relatedLead && (
                  <p className="text-gray-400 text-sm">None</p>
                )}

              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
