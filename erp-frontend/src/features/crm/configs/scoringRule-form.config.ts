import { FormConfig } from "@/components/v2/forms";
import { FIELD_OPTIONS, OPERATOR_OPTIONS } from "./pipelineStage-form.config";
import { CreateScoringRuleDto, UpdateScoringRuleDto } from "../dto/scoringRule.dto";

export const scoringRuleFormConfig: FormConfig<CreateScoringRuleDto | UpdateScoringRuleDto> = {
  sections: [
    {
      title: "Thông tin luật chấm điểm",
      columns: 2,
      fields: [
        {
          name: "name",
          label: "Tên luật",
          type: "text",
          placeholder: "VD: Lead ngành Công nghệ được +15 điểm",
          required: true,
          validation: (v) => {
            if (!v) return "Tên luật là bắt buộc";
            if (v.length < 3) return "Tên luật phải có ít nhất 3 ký tự";
            return undefined;
          },
          gridColumn: "span 2",
        },
        {
          name: "field",
          label: "Trường đánh giá",
          type: "select",
          required: true,
          options: FIELD_OPTIONS,
          validation: (v) => (!v ? "Chọn trường cần đánh giá" : undefined),
          gridColumn: "span 1",
        },
        {
          name: "operator",
          label: "Điều kiện",
          type: "select",
          required: true,
          options: OPERATOR_OPTIONS,
          validation: (v) => (!v ? "Chọn điều kiện" : undefined),
          gridColumn: "span 1",
        },
        {
          name: "value",
          label: "Giá trị so sánh",
          type: "text",
          placeholder: "VD: Công nghệ, enterprise, 5...",
          helpText: "Để trống nếu dùng điều kiện is_true/is_false",
          gridColumn: "span 1",
        },
        {
          name: "score",
          label: "Điểm cộng",
          type: "number",
          required: true,
          defaultValue: 10,
          validation: (v) => {
            if (v === null || v === undefined) return "Điểm là bắt buộc";
            if (v < 0) return "Điểm không được âm";
            return undefined;
          },
          helpText: "Số điểm cộng vào lead_score khi khớp luật",
          gridColumn: "span 1",
        },
      ],
    },
  ],
  submitLabel: "Lưu luật",
  cancelLabel: "Hủy",
  showCancel: true,
};
