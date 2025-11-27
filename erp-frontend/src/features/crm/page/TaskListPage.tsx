// src/features/crm/pages/TaskBoardPage.tsx

import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { getAllActivities } from "../service/activity.service";
import { Activity } from "../dto/activity.dto";

import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

import { Flag, Calendar, User, CheckSquare } from "lucide-react";

type TaskStatus = "Not Started" | "In Progress" | "Completed";

const TASK_COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: "Not Started", label: "Not Started", color: "bg-gray-50" },
  { key: "In Progress", label: "In Progress", color: "bg-blue-50" },
  { key: "Completed", label: "Completed", color: "bg-green-50" },
];

export default function TaskBoardPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [filter, setFilter] = useState<string>("all");

  const DATE_FILTERS = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "this_week", label: "This Week" },
    { key: "this_month", label: "This Month" },
    { key: "all", label: "All" },
  ];

  // ========================================================
  // LOAD DATA
  // ========================================================
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getAllActivities();
      const tasks = res.filter((a: Activity) => a.activity_type === "task");
      setData(tasks);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách công việc"
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // DATE FILTER
  // ========================================================
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
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          start.setDate(now.getDate() - now.getDay());
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

  // ========================================================
  // GROUP BY STATUS
  // ========================================================
  const grouped: Record<TaskStatus, Activity[]> = {
    "Not Started": [],
    "In Progress": [],
    Completed: [],
  };

  filteredData.forEach((task: Activity) => {
    const status = (task.task?.status || "Not Started") as TaskStatus;
    grouped[status].push(task);
  });

  // ========================================================
  // UI
  // ========================================================
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Task Board</h1>
            <p className="text-sm text-gray-500">Kanban theo trạng thái công việc.</p>
          </div>

          <div className="flex items-center gap-3">

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

            <Button onClick={() => navigate("/crm/activities/task/create")}>
              + Create Task
            </Button>
          </div>
        </div>

        {error && <Alert type="error" message={error} />}

        {/* KANBAN BOARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TASK_COLUMNS.map((col) => {
            const list = grouped[col.key];

            return (
              <div
                key={col.key}
                className="bg-white rounded-xl shadow-sm flex flex-col h-[75vh]"
              >
                <div
                  className={`px-4 py-3 border-b text-sm font-semibold flex justify-between items-center ${col.color}`}
                >
                  <span>
                    {col.label} <span className="text-gray-500">({list.length})</span>
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">

                  {loading && !list.length && (
                    <p className="text-xs text-gray-400">Loading...</p>
                  )}

                  {!loading && !list.length && (
                    <p className="text-xs text-gray-400">Không có task.</p>
                  )}

                  {list.map((task: Activity) => (
                    <TaskItemCard
                      key={task.id}
                      task={task}
                      onClick={() =>
                        navigate(`/crm/activities/task/${task.id}`)
                      }
                    />
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

// ==================================================================
// CARD COMPONENT
// ==================================================================

interface CardProps {
  task: Activity;
  onClick?: () => void;
}

function TaskItemCard({ task, onClick }: CardProps) {
  const priorityColor =
    {
      high: "bg-red-100 text-red-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-blue-100 text-blue-700",
    }[task.priority || "medium"];

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:shadow-md hover:border-blue-300 transition"
    >
      {/* TITLE */}
      <div className="flex items-center gap-2">
        <CheckIcon status={task.task?.status} />

        <p className="text-sm font-semibold text-gray-800">
          {task.subject || "(No Subject)"}
        </p>

        {task.priority && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColor}`}
          >
            {task.priority.toUpperCase()}
          </span>
        )}
      </div>

      {/* RELATED */}
      <p className="text-xs text-gray-500">
        {task.lead?.name ||
          task.opportunity?.name ||
          task.customer?.name ||
          "-"}
      </p>

      {/* DUE DATE + OWNER */}
      <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />{" "}
          {task.due_at
            ? new Date(task.due_at).toLocaleDateString("vi-VN")
            : "—"}
        </span>

        {task.owner && (
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> {task.owner.full_name}
          </span>
        )}
      </div>
    </button>
  );
}

function CheckIcon({ status }: { status?: string }) {
  if (status === "Completed")
    return <CheckSquare className="w-3.5 h-3.5 text-green-600" />;
  if (status === "In Progress")
    return <Flag className="w-3.5 h-3.5 text-blue-600" />;
  return <Flag className="w-3.5 h-3.5 text-gray-500" />;
}
