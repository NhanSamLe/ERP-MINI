// src/features/crm/pages/MeetingListPage.tsx

import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { DataTable } from "../../../components/ui/DataTable";
import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";

import { fetchAllActivities } from "../store/activitySlice";
import { Activity } from "../dto/activity.dto";

export default function MeetingListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { all, loading, error } = useAppSelector((s) => s.activity);

  // Lọc activity_type === 'meeting'
  const meetings = useMemo(
    () => all.filter((a: Activity) => a.activity_type === "meeting"),
    [all]
  );

  useEffect(() => {
    dispatch(fetchAllActivities());
  }, [dispatch]);

  const columns = [
    {
      key: "subject",
      label: "Tiêu đề",
      sortable: true,
      render: (row: Activity) => (
        <button
          className="text-blue-600 hover:underline"
          onClick={() => navigate(`/crm/activities/meeting/${row.id}`)}
        >
          {row.subject || "(Không có tiêu đề)"}
        </button>
      ),
    },
    {
      key: "start_at",
      label: "Bắt đầu",
      sortable: true,
      render: (row: Activity) =>
        row.meeting?.start_at
          ? new Date(row.meeting.start_at).toLocaleString("vi-VN")
          : "-",
    },
    {
      key: "end_at",
      label: "Kết thúc",
      sortable: true,
      render: (row: Activity) =>
        row.meeting?.end_at
          ? new Date(row.meeting.end_at).toLocaleString("vi-VN")
          : "-",
    },
    {
      key: "related",
      label: "Liên quan",
      render: (row: Activity) =>
        row.lead?.name || row.opportunity?.name || row.customer?.name || "-",
    },
    {
      key: "owner",
      label: "Owner",
      render: (row: Activity) => row.owner?.full_name || "-",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <Button
            variant="primary"
            onClick={() => navigate("/crm/activities/meeting/create")}
          >
            + Tạo Meeting
          </Button>
        </div>

        {error && <Alert type="error" message={error} />}

        <DataTable<Activity>
          data={meetings}
          columns={columns}
          loading={loading}
          searchable
          searchKeys={["subject"]}
        />
      </div>
    </div>
  );
}
