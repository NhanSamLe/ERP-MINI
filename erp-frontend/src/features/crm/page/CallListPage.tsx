// src/features/crm/pages/CallBoardPage.tsx

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { getAllActivities } from "../service/activity.service";
import { Activity } from "../dto/activity.dto";

import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const CALL_COLUMNS = [
  { key: "pending", label: "Pending", color: "bg-yellow-50" },
  { key: "in_progress", label: "In Progress", color: "bg-blue-50" },
  { key: "completed", label: "Completed", color: "bg-green-50" },
  { key: "cancelled", label: "Cancelled", color: "bg-red-50" },
];

export default function CallBoardPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // ========================
  // FILTER STATE
  // ========================
  const DATE_FILTERS = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "this_week", label: "This Week" },
    { key: "this_month", label: "This Month" },
    { key: "all", label: "All" },
  ];

  const [filter, setFilter] = useState<string>("all");

  // ========================
  // FETCH DATA
  // ========================
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getAllActivities();
      const calls = res.filter((a: Activity) => a.activity_type === "call");
      setData(calls);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Không thể tải hoạt động cuộc gọi");
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // FILTER LOGIC
  // ========================
  const filteredData = useMemo(() => {
    const now = new Date();

    return data.filter((item) => {
      const created = item.created_at ? new Date(item.created_at) : null;
      if (!created) return false;

      switch (filter) {
        case "today":
          return created.toDateString() === now.toDateString();

        case "yesterday": {
          const y = new Date();
          y.setDate(now.getDate() - 1);
          return created.toDateString() === y.toDateString();
        }

        case "this_week": {
          const start = new Date(now);
          start.setHours(0, 0, 0, 0);
          start.setDate(now.getDate() - now.getDay()); // Thứ 2 đầu tuần
          return created >= start;
        }

        case "this_month":
          return (
            created.getMonth() === now.getMonth() &&
            created.getFullYear() === now.getFullYear()
          );

        default:
          return true;
      }
    });
  }, [data, filter]);

  // ========================
  // GROUP DATA BY STATUS
  // ========================
  const grouped: Record<string, Activity[]> = {
    pending: [],
    in_progress: [],
    completed: [],
    cancelled: [],
  };

  filteredData.forEach((call) => {
    const s = call.status || "pending";
    if (!grouped[s]) grouped[s] = [];
    grouped[s].push(call);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Call Activity Board</h1>
            <p className="text-sm text-gray-500">
              Kanban theo trạng thái cuộc gọi.
            </p>
          </div>

        <div className="flex items-center gap-3">
        {/* DATE FILTER */}
        <div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            {DATE_FILTERS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
          <Button onClick={() => navigate("/crm/activities/call/create")}>
            + Log Call
          </Button>
        </div>
      </div>
        {error && <Alert type="error" message={error} />}

        

        {/* BOARD */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          {CALL_COLUMNS.map((col) => {
            const list = grouped[col.key] ?? [];

            return (
              <div
                key={col.key}
                className="bg-white rounded-xl shadow-sm flex flex-col h-[75vh]"
              >
                {/* HEADER */}
                <div
                  className={`px-4 py-3 border-b text-sm font-semibold flex justify-between items-center ${col.color}`}
                >
                  <span>
                    {col.label} <span className="text-gray-500">({list.length})</span>
                  </span>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {loading && !list.length && (
                    <p className="text-xs text-gray-400">Loading...</p>
                  )}

                  {!loading && !list.length && (
                    <p className="text-xs text-gray-400">Không có cuộc gọi.</p>
                  )}

                  {list.map((call) => (
                    <button
                      key={call.id}
                      onClick={() => navigate(`/crm/activities/call/${call.id}`)}
                      className="w-full text-left bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:shadow-md hover:border-blue-300 transition"
                    >
                      {/* SUBJECT + PRIORITY */}
                      <div className="flex items-center gap-2">
                        {call.call?.is_inbound ? (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                          )}
                        <p className="text-sm font-semibold text-gray-800">
                          {call.subject || "(No Subject)"}
                        </p>

                        {/* Priority badge */}
                        {call.priority && (
                          <span
                            className={`
                              text-[10px] px-2 py-0.5 rounded-full font-medium
                              ${call.priority === "high" ? "bg-red-100 text-red-700" : ""}
                              ${call.priority === "medium" ? "bg-yellow-100 text-yellow-700" : ""}
                              ${call.priority === "low" ? "bg-blue-100 text-blue-700" : ""}
                            `}
                          >
                            {call.priority.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Related info */}
                      <p className="text-xs text-gray-500">
                        {call.lead?.name ||
                          call.opportunity?.name ||
                          call.customer?.name ||
                          "-"}
                      </p>

                      {/* Duration + Date */}
                      <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                        <span>{call.call?.duration ?? "-"} sec</span>
                        <span>
                          {call.created_at
                            ? new Date(call.created_at).toLocaleDateString("vi-VN")
                            : "—"}
                        </span>
                      </div>
                    </button>
                  ))}

                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
