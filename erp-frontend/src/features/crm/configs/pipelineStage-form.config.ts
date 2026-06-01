import { FormConfig, SelectOption } from "@/components/v2/forms";
import { CreatePipelineStageDto, UpdatePipelineStageDto } from "../dto/pipeline.dto";

export const createPipelineStageFormConfig = (): FormConfig<CreatePipelineStageDto> => ({
  sections: [
    {
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
          gridColumn: "span 2",
        },
        {
          name: "probability",
          label: "Xác suất thắng (%)",
          type: "number",
          defaultValue: 0,
          helpText: "0–100. VD: 10% với Leads mới, 75% với Gửi báo giá",
          gridColumn: "span 1",
        },
        {
          name: "color",
          label: "Mã màu",
          type: "text",
          placeholder: "#f97316",
          defaultValue: "#f97316",
          helpText: "Mã hex color cho stage",
          gridColumn: "span 1",
        },
        {
          name: "stage_type",
          label: "Loại giai đoạn",
          type: "select",
          options: [
            { value: "normal", label: "Bình thường" },
            { value: "won", label: "✓ Thắng (WON)" },
            { value: "lost", label: "✗ Thua (LOST)" },
          ],
          helpText: "WON / LOST chỉ chọn được 1 loại",
          gridColumn: "span 2",
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
  { value: "greater_than_or_equal", label: "Lớn hơn hoặc bằng (>=)" },
  { value: "less_than_or_equal", label: "Nhỏ hơn hoặc bằng (<=)" },
  { value: "is_true", label: "Đúng (true)" },
  { value: "is_false", label: "Sai (false)" },
  { value: "not_empty", label: "Có dữ liệu" },
  { value: "empty", label: "Trống" },
  { value: "in", label: "Nằm trong danh sách" },
];

const FIELD_OPTIONS: SelectOption[] = [
  { value: "phone", label: "Số điện thoại" },
  { value: "email", label: "Email" },
  { value: "source", label: "Nguồn dạng text" },
  { value: "industry", label: "Ngành nghề" },
  { value: "company_size", label: "Quy mô công ty" },
  { value: "annual_revenue", label: "Doanh thu năm" },
  { value: "source_id", label: "Nguồn Lead" },
  { value: "has_budget", label: "Có ngân sách" },
  { value: "ready_to_buy", label: "Sẵn sàng mua" },
  { value: "expected_timeline", label: "Thời gian dự kiến" },
  { value: "activity.call.connected_count", label: "Số cuộc gọi thành công" },
  { value: "activity.email.replied_count", label: "Số email inbound/phản hồi" },
  { value: "activity.meeting.count", label: "Số meeting" },
  { value: "activity.meeting.completed_count", label: "Số meeting hoàn thành" },
  { value: "activity.task.overdue_count", label: "Số task quá hạn" },
  { value: "no_contact_after_hours", label: "Số giờ chưa liên hệ" },
];

export const editPipelineStageFormConfig: FormConfig<UpdatePipelineStageDto> = {
  sections: [
    {
      columns: 2,
      fields: [
        {
          name: "name",
          label: "Tên giai đoạn",
          type: "text",
          required: true,
          gridColumn: "span 2",
        },
        {
          name: "sequence",
          label: "Thứ tự (vị trí)",
          type: "number",
          required: true,
          helpText: "Đặt số nhỏ hơn để chèn lên trước, lớn hơn để đẩy xuống sau",
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
          placeholder: "#f97316",
          gridColumn: "span 1",
        },
        {
          name: "stage_type",
          label: "Loại giai đoạn",
          type: "select",
          options: [
            { value: "normal", label: "Bình thường" },
            { value: "won", label: "✓ Thắng (WON)" },
            { value: "lost", label: "✗ Thua (LOST)" },
          ],
          helpText: "WON / LOST chỉ chọn được 1 loại",
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
