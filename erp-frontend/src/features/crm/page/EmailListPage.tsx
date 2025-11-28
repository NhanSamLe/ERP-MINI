// src/features/crm/pages/EmailListPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getAllActivities } from "../service/activity.service";
import { Activity } from "../dto/activity.dto";

import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

import {
  Mail,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDateTime } from "@/utils/time.helper";

type DirectionFilter = "all" | "in" | "out";
type DateFilter = "all" | "today" | "yesterday" | "this_week" | "this_month";

export default function EmailListPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [direction, setDirection] = useState<DirectionFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [search, setSearch] = useState<string>("");

  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const PAGE_SIZE = 10;
  const [page, setPage] = useState<number>(1);

  // ======================================================
  // Load Data
  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getAllActivities();
      const emails = res.filter((x) => x.activity_type === "email");
      setData(emails);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Không thể tải danh sách email");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // Date Filtering
  const filterByDate = (list: Activity[]) => {
    if (dateFilter === "all") return list;

    const today = new Date();

    return list.filter((x) => {
      if (!x.created_at) return false;
      const d = new Date(x.created_at);

      switch (dateFilter) {
        case "today":
          return d.toDateString() === today.toDateString();

        case "yesterday": {
          const y = new Date(today);
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

  // ======================================================
  // Helpers for Sorting
  const getValue = (row: Activity, key: string): string | number => {
    switch (key) {
      case "subject":
        return row.subject ?? "";

      case "email_from":
        return row.email?.email_from ?? "";

      case "email_to":
        return row.email?.email_to ?? "";

      case "status":
        return row.email?.status ?? "";

      case "direction":
        return row.email?.direction ?? "";

      case "related":
        return (
          row.lead?.name ||
          row.customer?.name ||
          row.opportunity?.name ||
          ""
        );

      case "created_at":
        return row.created_at ? new Date(row.created_at).getTime() : 0;

      default:
        return "";
    }
  };

  // ======================================================
  // Final filtered + sorted + paginated data
  const finalData = useMemo(() => {
    let list = [...data];

    // filter direction
    if (direction !== "all") {
      list = list.filter((x) => x.email?.direction === direction);
    }

    // filter date
    list = filterByDate(list);

    // search
    if (search.trim().length > 0) {
      const s = search.toLowerCase();

      list = list.filter((row) => {
        const fields = [
          row.subject,
          row.email?.email_from,
          row.email?.email_to,
          row.lead?.name,
          row.customer?.name,
          row.opportunity?.name,
        ];

        return fields.filter(Boolean).some((v) => v!.toLowerCase().includes(s));
      });
    }

    // sort
    list.sort((a, b) => {
      const aV = getValue(a, sortKey);
      const bV = getValue(b, sortKey);

      if (aV < bV) return sortDirection === "asc" ? -1 : 1;
      if (aV > bV) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [data, direction, dateFilter, search, sortKey, sortDirection]);

  // pagination slice
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return finalData.slice(start, start + PAGE_SIZE);
  }, [finalData, page]);

  // total pages
  const totalPages = Math.ceil(finalData.length / PAGE_SIZE);

  // ======================================================
  // Render UI
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-6 h-6 text-orange-500" />
            Email Activities
          </h1>

          <Button onClick={() => navigate("/crm/activities/email/create")}>
            + Compose Email
          </Button>
        </div>

        {error && <Alert type="error" message={error} />}

    {/* FILTER BAR */}
    <div className="bg-white p-4 border rounded-lg shadow-sm">
      <div className="flex flex-wrap items-center gap-4">

        {/* SEARCH */}
        <div className="relative flex-1 min-w-[250px]">
        
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search emails..."
            className="pl-10 pr-4 py-2 rounded-lg border bg-gray-50 
                      focus:ring-2 focus:ring-orange-500 focus:bg-white 
                      transition w-full h-[42px]"
          />
        </div>

        {/* RIGHT SIDE WRAPPER */}
        <div className="flex items-center gap-6">

          {/* DIRECTION SELECT */}
          <div className="flex flex-col">
          
            <select
              value={direction}
              onChange={(e) => {
                setDirection(e.target.value as DirectionFilter);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg border bg-gray-50 
                        focus:ring-2 focus:ring-blue-500 transition
                        min-w-[140px] h-[42px]"
            >
              <option value="all">All</option>
              <option value="in">Inbound</option>
              <option value="out">Outbound</option>
            </select>
          </div>

          {/* DATE SELECT */}
          <div className="flex flex-col">
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as DateFilter);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg border bg-gray-50 
                        focus:ring-2 focus:ring-orange-500 transition
                        min-w-[150px] h-[42px]"
            >
              <option value="all">All</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
          </div>

        </div>
      </div>
    </div>


        {/* TABLE */}
        <div className="bg-white border rounded-xl shadow">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                {[
                  { key: "subject", label: "Subject" },
                  { key: "related", label: "Related To" },
                  { key: "direction", label: "Type" },
                  { key: "email_from", label: "From" },
                  { key: "email_to", label: "To" },
                  { key: "status", label: "Status" },
                  { key: "created_at", label: "Created At" },
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
                    className="px-4 py-2 text-left text-sm font-medium text-gray-600 cursor-pointer select-none"
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
                  <td className="p-6 text-center" colSpan={7}>
                    Loading...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td className="p-6 text-center" colSpan={7}>
                    No emails found.
                  </td>
                </tr>
              ) : (
                paginated.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => navigate(`/crm/activities/email/${e.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-blue-600">
                      {e.subject}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {e.lead?.name ||
                        e.opportunity?.name ||
                        e.customer?.name ||
                        "—"}
                    </td>
                    <td className="px-4 py-3">
                      {e.email?.direction === "in" ? (
                        <span className="flex items-center text-green-600 gap-1">
                          <ArrowDownLeft className="w-4 h-4" /> Inbound
                        </span>
                      ) : (
                        <span className="flex items-center text-blue-600 gap-1">
                          <ArrowUpRight className="w-4 h-4" /> Outbound
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{e.email?.email_from}</td>
                    <td className="px-4 py-3">{e.email?.email_to}</td>
                    <td className="px-4 py-3">{e.email?.status || "—"}</td>
                    <td className="px-4 py-3">
                      {formatDateTime(e.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * PAGE_SIZE + 1} – 
            {Math.min(page * PAGE_SIZE, finalData.length)} of{" "}
            {finalData.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 border rounded disabled:opacity-40 hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-orange-500 text-white rounded">
              {page}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 border rounded disabled:opacity-40 hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
