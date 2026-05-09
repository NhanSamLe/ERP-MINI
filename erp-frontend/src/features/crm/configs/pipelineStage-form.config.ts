import { FormConfig, SelectOption } from "@/components/v2/forms";
import { CreatePipelineStageDto, UpdatePipelineStageDto } from "../dto/pipeline.dto";

export const createPipelineStageFormConfig = (
  stageCount: number
): FormConfig<CreatePipelineStageDto> => ({
  sections: [
    {
      title: "Thêm giai đoạn mới",
      columns: 2,
      fields: [
        {
          name: "name",
          label: "Tên giai đoạn",
          type: "text",
          placeholder: "VD: Leads mới, Đã liên hệ, Đang đàm phán...",
          required: true,
          validation: (v) => {
            if (!v) return "Tên giai đoạn là bắt buộc";
            if (v.length < 2) return "Tên phải có ít nhất 2 ký tự";
            return undefined;
          },
          gridColumn: "span 1",
        },
        {
          name: "sequence",
          label: "Thứ tự",
          type: "number",
          required: true,
          defaultValue: stageCount + 1,
          helpText: "Thứ tự hiển thị trong Pipeline (1, 2, 3...)",
          gridColumn: "span 1",
        },
        {
          name: "probability",
          label: "Xác suất thắng (%)",
          type: "number",
          defaultValue: 0,
          helpText: "0-100. VD: 10% với Leads mới, 75% với Gửi báo giá",
          gridColumn: "span 1",
        },
        {
          name: "color",
          label: "Mã màu",
          type: "text",
          placeholder: "#3498db",
          defaultValue: "#3498db",
          helpText: "Mã hex color cho stage trên Kanban board",
          gridColumn: "span 1",
        },
        {
          name: "is_won",
          label: "Đánh dấu là Stage THẮNG",
          type: "checkbox",
          helpText: "Deal vào stage này sẽ tự động chuyển thành WON",
          gridColumn: "span 1",
        },
        {
          name: "is_lost",
          label: "Đánh dấu là Stage THUA",
          type: "checkbox",
          helpText: "Deal vào stage này sẽ tự động chuyển thành LOST",
          gridColumn: "span 1",
        },
      ],
    },
  ],
  submitLabel: "Thêm Stage",
  cancelLabel: "Hủy",
  showCancel: true,
});

const OPERATOR_OPTIONS: SelectOption[] = [
  { value: "equals", label: "Bằng (=)" },
  { value: "not_equals", label: "Không bằng (!=)" },
  { value: "contains", label: "Chứa" },
  { value: "greater_than", label: "Lớn hơn (>)" },
  { value: "less_than", label: "Nhỏ hơn (<)" },
  { value: "is_true", label: "Đúng (true)" },
  { value: "is_false", label: "Sai (false)" },
];

const FIELD_OPTIONS: SelectOption[] = [
  { value: "industry", label: "Ngành nghề" },
  { value: "company_size", label: "Quy mô công ty" },
  { value: "source_id", label: "Nguồn Lead" },
  { value: "has_budget", label: "Có ngân sách" },
  { value: "ready_to_buy", label: "Sẵn sàng mua" },
];

export const editPipelineStageFormConfig: FormConfig<UpdatePipelineStageDto> = {
  sections: [
    {
      title: "Chỉnh sửa giai đoạn",
      columns: 2,
      fields: [
        {
          name: "name",
          label: "Tên giai đoạn",
          type: "text",
          required: true,
          gridColumn: "span 1",
        },
        {
          name: "sequence",
          label: "Thứ tự",
          type: "number",
          required: true,
          gridColumn: "span 1",
        },
        {
          name: "probability",
          label: "Xác suất thắng (%)",
          type: "number",
          gridColumn: "span 1",
        },
        {
          name: "color",
          label: "Mã màu",
          type: "text",
          placeholder: "#3498db",
          gridColumn: "span 1",
        },
        {
          name: "is_won",
          label: "Stage THẮNG",
          type: "checkbox",
          gridColumn: "span 1",
        },
        {
          name: "is_lost",
          label: "Stage THUA",
          type: "checkbox",
          gridColumn: "span 1",
        },
      ],
    },
  ],
  submitLabel: "Cập nhật Stage",
  cancelLabel: "Hủy",
  showCancel: true,
};

export { FIELD_OPTIONS, OPERATOR_OPTIONS };
