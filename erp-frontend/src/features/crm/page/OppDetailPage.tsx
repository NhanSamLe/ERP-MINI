// src/features/crm/pages/OppDetailPage.tsx

import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";

import {
  fetchOpportunityDetail,
  markWon,
  markLost,
  deleteOpportunity,
} from "../store/opportunity/opportunity.thunks";

import { UiAlert } from "../../../types/ui";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";

import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Trash2,
  Calendar,
  User,
  ListChecks,
} from "lucide-react";

export default function OppDetailPage() {
  const { id } = useParams();
  const oppId = Number(id);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { detail, loading, error } = useAppSelector((s) => s.opportunity);
  const [alert, setAlert] = useState<UiAlert | null>(null);

  useEffect(() => {
    dispatch(fetchOpportunityDetail(oppId));
  }, [dispatch, oppId]);

  if (!detail) {
    return <div className="p-6">{loading ? "Đang tải..." : "Không tìm thấy Opportunity"}</div>;
  }

  const { lead, customer, owner } = detail;

  const handleMarkWon = async () => {
    try {
      await dispatch(markWon(oppId)).unwrap();
      setAlert({ type: "success", message: "Opportunity đã được đánh dấu Win!" });
    } catch {
      setAlert({ type: "error", message: "Không thể đánh dấu Win" });
    }
  };

  const handleMarkLost = async () => {
    const reason = prompt("Nhập lý do mất cơ hội (Lost Reason):");
    if (!reason) return;

    try {
      await dispatch(markLost({ oppId, reason })).unwrap();
      setAlert({ type: "success", message: "Đã chuyển Opp sang Lost" });
    } catch {
      setAlert({ type: "error", message: "Không thể cập nhật" });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn chắc muốn xoá Opportunity này?")) return;

    try {
      await dispatch(deleteOpportunity(oppId)).unwrap();
      navigate("/crm/opportunities");
    } catch {
      setAlert({ type: "error", message: "Không thể xoá" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* HEADER */}
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-5 rounded-xl shadow flex items-center justify-between">

          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 rounded-full">
              <ArrowLeft />
            </button>
            <h1 className="font-bold text-xl">{detail.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            {detail.stage !== "won" && detail.stage !== "lost" && (
              <>
                <Button variant="success" onClick={handleMarkWon}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Mark Won
                </Button>
                <Button variant="warning" onClick={handleMarkLost}>
                  <XCircle className="w-4 h-4 mr-1" /> Mark Lost
                </Button>
              </>
            )}

            <Button
              variant="secondary"
              onClick={() => navigate(`/crm/opportunities/${oppId}/edit`)}
            >
              <ListChecks className="w-4 h-4 mr-1" /> Update
            </Button>

            <Button variant="outline" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        </div>

        {/* ALERT */}
        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}
        {error && <Alert type="error" message={error} />}

        {/* MAIN CONTENT – GRID 2 COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT COLUMN */}
          <div className="space-y-6">

            {/* OPPORTUNITY BASIC */}
            <div className="bg-white p-6 rounded-xl shadow space-y-3">
              <h2 className="text-lg font-semibold border-b pb-2">Thông tin Opportunity</h2>

              <InfoRow label="Stage" value={detail.stage} />
              <InfoRow label="Expected Value" value={`${detail.expected_value || 0} USD`} icon={<DollarSign />} />
              <InfoRow label="Probability" value={`${(detail.probability || 0) * 100}%`} icon={<TrendingUp />} />

              <InfoRow
                label="Closing Date"
                value={
                  detail.closing_date
                    ? new Date(detail.closing_date).toLocaleDateString("vi-VN")
                    : "-"
                }
                icon={<Calendar />}
              />

              {detail.loss_reason && (
                <InfoRow label="Loss Reason" value={detail.loss_reason} />
              )}
            </div>

            {/* RELATED */}
            <div className="bg-white p-6 rounded-xl shadow space-y-3">
              <h2 className="text-lg font-semibold border-b pb-2">Liên kết</h2>

              {lead && (
                <InfoRow
                  label="Lead"
                  value={<Link className="text-blue-600 underline" to={`/crm/leads/${lead.id}`}>{lead.name}</Link>}
                />
              )}

              {customer && (
                <InfoRow
                  label="Customer"
                  value={<Link className="text-blue-600 underline" to={`/crm/customers/${customer.id}`}>{customer.name}</Link>}
                />
              )}

              {owner && (
                <InfoRow label="Owner" value={
                  <div className="flex items-center gap-2">
                    <User /> {owner.full_name}
                  </div>
                } />
              )}
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">

            {/* META INFO */}
            <div className="bg-white p-6 rounded-xl shadow space-y-2">
              <h2 className="text-lg font-semibold border-b pb-2">Thông tin hệ thống</h2>

              <InfoRow
                label="Created At"
                value={new Date(detail.created_at).toLocaleString("vi-VN")}
              />

              <InfoRow
                label="Updated At"
                value={new Date(detail.updated_at).toLocaleString("vi-VN")}
              />
            </div>

            {/* RELATED ACTIVITIES */}
            <div className="bg-white p-6 rounded-xl shadow space-y-3">
              <h2 className="text-lg font-semibold border-b pb-2">Activity liên quan</h2>

              <Button
                variant="primary"
                onClick={() => navigate(`/crm/activities?relatedType=opportunity&id=${oppId}`)}
              >
                Xem tất cả Activity
              </Button>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start py-1">
      <div className="text-gray-600 font-medium flex items-center gap-2">
        {icon} {label}
      </div>
      <div className="text-gray-900">{value}</div>
    </div>
  );
}
