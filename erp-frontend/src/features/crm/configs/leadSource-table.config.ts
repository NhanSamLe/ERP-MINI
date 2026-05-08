import React from "react";
import { TableConfig } from "@/components/v2/tables";
import { LeadSource } from "../dto/leadSource.dto";

export const leadSourceTableConfig = (
  onEdit: (item: LeadSource) => void,
  onDelete: (item: LeadSource) => void
): TableConfig<LeadSource> => ({
  columns: [
    { key: "id", label: "ID", sortable: true, width: "80px" },
    { key: "name", label: "Tên nguồn", sortable: true },
    {
      key: "description",
      label: "Mô tả",
      render: (v) => v || "-",
    },
    {
      key: "is_active",
      label: "Trạng thái",
      width: "130px",
      render: (v) =>
        v
          ? React.createElement(
              "span",
              { className: "inline-flex items-center gap-1 text-green-600 font-medium" },
              React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-green-500 inline-block" }),
              " Hoạt động"
            )
          : React.createElement("span", { className: "text-gray-400" }, "Không hoạt động"),
    },
  ],
  actions: [
    { label: "Sửa", onClick: onEdit, variant: "primary" },
    { label: "Xóa", onClick: onDelete, variant: "danger" },
  ],
  pagination: true,
  sortable: true,
  searchable: true,
  searchPlaceholder: "Tìm theo tên nguồn...",
  emptyMessage: "Chưa có nguồn Lead nào. Hãy tạo nguồn đầu tiên.",
  loadingMessage: "Đang tải...",
  rowKey: "id",
});
