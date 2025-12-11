// src/features/crm/pages/MeetingListPage.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getAllActivities } from "../service/activity.service";
import { Activity } from "../dto/activity.dto";

import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { formatDateTime } from "@/utils/time.helper";

// =======================
// TYPE FILTERS
// =======================
type DateFilter = "all" | "today" | "yesterday" | "this_week" | "this_month";
type StatusFilter = "all" | "upcoming" | "ongoing" | "finished";

export default function MeetingListPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FILTER STATES
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Sorting
  const [sortKey, setSortKey] = useState<string>("start_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  // =======================
  // FETCH DATA
  // =======================
  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getAllActivities();
      const meetings = res.filter((x) => x.activity_type === "meeting");
      setData(meetings);
    } catch (err: unknown) {
      let message ="Không thể tải meetings"
      if(err instanceof Error)
      {
        message =err.message
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // =======================
  // DATE FILTER FUNCTION
  // =======================
  const filterByDatePreset = (list: Activity[]) => {
    if (dateFilter === "all") return list;

    const today = new Date();

    return list.filter((row) => {
      if (!row.meeting?.start_at) return false;

      const d = new Date(row.meeting.start_at);

      switch (dateFilter) {
        case "today":
          return d.toDateString() === today.toDateString();

        case "yesterday": {
          const y = new Date();
          y.setDate(today.getDate() - 1);
          return d.toDateString() === y.toDateString();
        }

        case "this_week": {
          const start = new Date(today);
          start.setDate(today.getDate() - today.getDay());
          return d >= start;
        }

        case "this_month":
          return (
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear()
          );

        default:
          return true;
      }
    });
  };

  // =======================
  // STATUS FILTER
  // =======================
  const getStatus = (row: Activity) => {
    const start = row.meeting?.start_at ? new Date(row.meeting.start_at) : null;
    const end = row.meeting?.end_at ? new Date(row.meeting.end_at) : null;
    const now = new Date();

    if (!start) return "upcoming";

    if (end && now > end) return "finished";
    if (start <= now && (!end || now <= end)) return "ongoing";
    if (now < start) return "upcoming";

    return "upcoming";
  };

  // =======================
  // FINAL FILTER + SORTING
  // =======================
  const finalData = useMemo(() => {
    let list = [...data];

    // DATE FILTER PRESET
    list = filterByDatePreset(list);

    // CUSTOM DATE RANGE
    if (fromDate) {
      const from = new Date(fromDate);
      list = list.filter(
        (x) => x.meeting?.start_at && new Date(x.meeting.start_at) >= from
      );
    }

    if (toDate) {
      const to = new Date(toDate);
      list = list.filter(
        (x) => x.meeting?.start_at && new Date(x.meeting.start_at) <= to
      );
    }

    // STATUS FILTER
    if (statusFilter !== "all") {
      list = list.filter((x) => getStatus(x) === statusFilter);
    }

    // SEARCH
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((row) => {
        const fields = [
          row.subject,
          row.meeting?.location,
          row.lead?.name,
          row.opportunity?.name,
          row.customer?.name,
          row.owner?.full_name,
        ];

        return fields.filter(Boolean).some((v) => v!.toLowerCase().includes(s));
      });
    }

    // SORT
    list.sort((a, b) => {
      const getValue = (row: Activity, key: string) => {
        switch (key) {
          case "subject":
            return row.subject ?? "";
          case "start_at":
            return row.meeting?.start_at
              ? new Date(row.meeting.start_at).getTime()
              : 0;
          case "end_at":
            return row.meeting?.end_at
              ? new Date(row.meeting.end_at).getTime()
              : 0;
          default:
            return "";
        }
      };

      const aV = getValue(a, sortKey);
      const bV = getValue(b, sortKey);

      if (aV < bV) return sortDirection === "asc" ? -1 : 1;
      if (aV > bV) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [data, search, dateFilter, statusFilter, fromDate, toDate, sortKey, sortDirection]);

  // =======================
  // PAGINATION
  // =======================
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return finalData.slice(start, start + PAGE_SIZE);
  }, [finalData, page]);

  const totalPages = Math.ceil(finalData.length / PAGE_SIZE);

  // =======================
  // UI
  // =======================
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Meetings
          </h1>
          <Button onClick={() => navigate("/crm/activities/meeting/create")}>
            + Schedule Meeting
          </Button>
        </div>

        {error && <Alert type="error" message={error} />}

        {/* FILTER BAR */}
        <div className="bg-white p-4 border rounded-lg shadow-sm">
          <div className="flex flex-wrap gap-4 items-end">

            {/* SEARCH */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search meetings..."
                className="pl-10 pr-3 py-2 border rounded-lg w-full bg-gray-50"
              />
            </div>

            {/* STATUS FILTER */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setPage(1);
              }}
              className="border px-3 py-2 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="finished">Finished</option>
            </select>

            {/* DATE FILTER */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as DateFilter);
                setPage(1);
              }}
              className="border px-3 py-2 rounded-lg"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>

            {/* DATE RANGE */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-500">From</label>
              <input
                    type="date"
                    value={fromDate}
                    max={toDate || undefined}        // 🔥 from ≤ to
                    onChange={(e) => {
                      const value = e.target.value;
                      setFromDate(value);

                      // Nếu fromDate vượt quá toDate → tự chỉnh lại toDate
                      if (toDate && value > toDate) setToDate(value);

                      setPage(1);
                    }}
                    className="border px-3 py-2 rounded-lg"
                  />
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-gray-500">To</label>
              <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}      // 🔥 to ≥ from
                  onChange={(e) => {
                    const value = e.target.value;
                    setToDate(value);

                    // Nếu toDate nhỏ hơn fromDate → tự chỉnh lại fromDate
                    if (fromDate && value < fromDate) setFromDate(value);

                    setPage(1);
                  }}
                  className="border px-3 py-2 rounded-lg"
                />
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto bg-white border rounded-xl shadow">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                {[
                  { key: "subject", label: "Subject" },
                  { key: "related", label: "Related To" },
                  { key: "location", label: "Location" },
                  { key: "start_at", label: "Start" },
                  { key: "end_at", label: "End" },
                  { key: "status", label: "Schedule Status" },
                  { key: "owner", label: "Owner" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => {
                      setPage(1);
                      if (sortKey === col.key) {
                        setSortDirection((p) => (p === "asc" ? "desc" : "asc"));
                      } else {
                        setSortKey(col.key);
                        setSortDirection("asc");
                      }
                    }}
                    className="px-4 py-2 text-left text-sm font-semibold cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        ))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center">
                    Loading...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center">
                    No meetings found.
                  </td>
                </tr>
              ) : (
                paginated.map((m) => {
                  const status = getStatus(m);
                  const statusColor =
                    status === "ongoing"
                      ? "text-blue-600"
                      : status === "finished"
                      ? "text-green-600"
                      : "text-gray-600";

                  return (
                    <tr
                      key={m.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        navigate(`/crm/activities/meeting/${m.id}`)
                      }
                    >
                      <td className="px-4 py-3 font-medium text-blue-600">
                        {m.subject}
                      </td>

                      <td className="px-4 py-3">
                        {m.lead?.name ||
                          m.opportunity?.name ||
                          m.customer?.name ||
                          "—"}
                      </td>

                      <td className="px-4 py-3">{m.meeting?.location || "—"}</td>

                      <td className="px-4 py-3">
                        {formatDateTime(m.meeting?.start_at)}
                      </td>

                      <td className="px-4 py-3">
                        {formatDateTime(m.meeting?.end_at)}
                      </td>

                      <td className={`px-4 py-3 font-medium ${statusColor}`}>
                        {status[0].toUpperCase() + status.slice(1)}
                      </td>

                      <td className="px-4 py-3 text-sm">
                        {m.owner?.full_name || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, finalData.length)} of{" "}
            {finalData.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 border rounded disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-blue-600 text-white rounded">
              {page}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 border rounded disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
