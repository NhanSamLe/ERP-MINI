import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { fetchAllActivities } from "../store/activitySlice";
import { Activity } from "../dto/activity.dto";

import { Button } from "../../../components/ui/Button";
import { DataTable } from "../../../components/ui/DataTable";
import { Alert } from "../../../components/ui/Alert";

export default function EmailListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { all, loading, error } = useAppSelector((s) => s.activity);

  const [filter, setFilter] = useState<"all" | "in" | "out">("all");

  useEffect(() => {
    dispatch(fetchAllActivities());
  }, [dispatch]);

  const emails = useMemo(() => {
    const data = all.filter((x) => x.activity_type === "email");
    if (filter === "all") return data;
    return data.filter((x) => x.email?.direction === filter);
  }, [all, filter]);

  const columns = [
    {
      key: "subject",
      label: "Subject",
      render: (row: Activity) => (
        <button
          className="text-blue-600 hover:underline"
          onClick={() => navigate(`/crm/activities/email/${row.id}`)}
        >
          {row.subject}
        </button>
      ),
    },
    {
      key: "direction",
      label: "Type",
      render: (row: Activity) =>
        row.email?.direction === "in"
          ? "Inbound"
          : "Outbound",
    },
    {
      key: "email_from",
      label: "From",
      render: (row: Activity) => row.email?.email_from ?? "-",
    },
    {
      key: "email_to",
      label: "To",
      render: (row: Activity) => row.email?.email_to ?? "-",
    },
    {
      key: "status",
      label: "Status",
      render: (row: Activity) => row.email?.status ?? "-",
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Emails</h1>

          <Button onClick={() => navigate("/crm/activities/email/create")}>
            + Compose Email
          </Button>
        </div>

        {/* FILTER */}
        <div className="flex gap-3">
          <button
            className={`px-3 py-1 rounded ${
              filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`px-3 py-1 rounded ${
              filter === "in" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setFilter("in")}
          >
            Inbound
          </button>
          <button
            className={`px-3 py-1 rounded ${
              filter === "out" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setFilter("out")}
          >
            Outbound
          </button>
        </div>

        {error && <Alert type="error" message={error} />}

        <DataTable<Activity>
          data={emails}
          columns={columns}
          loading={loading}
          searchable
        //   searchKeys={["subject", "email.email_from", "email.email_to"]}
        />
      </div>
    </div>
  );
}
