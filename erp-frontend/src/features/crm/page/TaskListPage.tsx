import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { fetchAllActivities } from "../store/activitySlice";

import { Activity, TaskDetail } from "../dto/activity.dto";
import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";

export default function TaskKanbanPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { all, error } = useAppSelector((s) => s.activity);

  useEffect(() => {
    dispatch(fetchAllActivities());
  }, [dispatch]);

  const tasks = useMemo(
    () => all.filter((t: Activity) => t.activity_type === "task"),
    [all]
  );

  const groupByStatus = (status: TaskDetail["status"]) =>
    tasks.filter((t) => t.task?.status === status);

  const columns = [
    { status: "Not Started", color: "bg-gray-100" },
    { status: "In Progress", color: "bg-blue-100" },
    { status: "Completed", color: "bg-green-100" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Task Kanban Board</h1>

          <Button onClick={() => navigate("/crm/activities/task/create")}>
            + Create Task
          </Button>
        </div>

        {error && <Alert type="error" message={error} />}

        {/* KANBAN */}
        <div className="grid grid-cols-3 gap-6">
          {columns.map((col) => (
            <div key={col.status} className="space-y-4">
              <h2 className="text-lg font-semibold">{col.status}</h2>

              <div className="space-y-3">
                {groupByStatus(col.status as TaskDetail["status"]).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    color={col.color}
                    onClick={() =>
                      navigate(`/crm/activities/task/${task.id}`)
                    }
                  />
                ))}

                {groupByStatus(col.status as TaskDetail["status"]).length === 0 && (
                  <p className="text-sm text-gray-500">Không có task</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  task: Activity;
  color: string;
  onClick?: () => void;
}

function TaskCard({ task, color, onClick }: CardProps) {
  return (
    <div
      className={`rounded-lg p-4 shadow hover:shadow-lg cursor-pointer transition ${color}`}
      onClick={onClick}
    >
      <div className="font-semibold text-gray-800">{task.subject}</div>

      <div className="text-sm text-gray-600 mt-1 flex justify-between">
        <span>Priority: {task.priority ?? "-"}</span>
        <span>Status: {task.task?.status ?? "-"}</span>
      </div>

      <div className="text-sm text-gray-600 mt-1">
        Due:{" "}
        {task.due_at
          ? new Date(task.due_at).toLocaleString("vi-VN")
          : "-"}
      </div>

      {/* RELATED */}
      <div className="text-xs text-gray-500 mt-2">
        {task.lead && <p>Lead: {task.lead.name}</p>}
        {task.opportunity && <p>Opp: {task.opportunity.name}</p>}
        {task.customer && <p>Cust: {task.customer.name}</p>}
      </div>

      {/* OWNER */}
      {task.owner && (
        <p className="text-xs text-gray-500 mt-1">
          Owner: {task.owner.full_name}
        </p>
      )}
    </div>
  );
}
