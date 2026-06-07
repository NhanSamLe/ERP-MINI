import React from "react";
import { TableConfig } from "@/components/v2/tables";
import { ScoringRule, ScoringSignal } from "../dto/scoringRule.dto";

const FIELD_LABELS: Record<string, string> = {
  industry: "Ngành nghề",
  company_size: "Quy mô công ty",
  source_id: "Nguồn Lead",
  has_budget: "Có ngân sách",
  ready_to_buy: "Sẵn sàng mua",
};

const OPERATOR_LABELS: Record<string, string> = {
  equals: "Bằng",
  not_equals: "Không bằng",
  contains: "Chứa",
  greater_than: "Lớn hơn",
  less_than: "Nhỏ hơn",
  is_true: "Đúng",
  is_false: "Sai",
};

export const scoringRuleTableConfig = (
  onEdit: (item: ScoringRule) => void,
  onDelete: (item: ScoringRule) => void,
  signals: ScoringSignal[] = []
): TableConfig<ScoringRule> => ({
  columns: [
    { key: "id", label: "ID", sortable: true, width: "60px" },
    { key: "name", label: "Tên luật", sortable: true },
    {
      key: "field",
      label: "Trường đánh giá",
      width: "140px",
      render: (v) => signals.find((signal) => signal.key === v)?.label || FIELD_LABELS[v] || v,
    },
    {
      key: "operator",
      label: "Điều kiện",
      width: "110px",
      render: (v) => OPERATOR_LABELS[v] || v,
    },
    {
      key: "value",
      label: "Giá trị",
      width: "130px",
      render: (v) => v || "-",
    },
    {
      key: "score",
      label: "Điểm",
      sortable: true,
      width: "80px",
      align: "right",
    },
    {
      key: "is_active",
      label: "Kích hoạt",
      width: "100px",
      render: (v) =>
        v
          ? React.createElement(
              "span",
              { className: "inline-flex items-center gap-1 text-green-600 font-medium" },
              React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-green-500 inline-block" }),
              " Có"
            )
          : React.createElement("span", { className: "text-gray-400" }, "Không"),
    },
  ],
  actions: [
    { label: "Sửa", onClick: onEdit, variant: "primary" },
    { label: "Xóa", onClick: onDelete, variant: "danger" },
  ],
  pagination: true,
  sortable: true,
  searchable: true,
  searchPlaceholder: "Tìm theo tên luật...",
  emptyMessage: "Chưa có luật chấm điểm nào. Hãy tạo luật đầu tiên.",
  loadingMessage: "Đang tải...",
  rowKey: "id",
});
