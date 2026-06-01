import { FormConfig } from "@/components/v2/forms";
import { CreatePipelineDto, UpdatePipelineDto } from "../dto/pipeline.dto";

export const pipelineFormConfig: FormConfig<CreatePipelineDto | UpdatePipelineDto> = {
  sections: [
    {
      columns: 1,
      fields: [
        {
          name: "name",
          label: "Tên Pipeline",
          type: "text",
          placeholder: "VD: Pipeline Bán Hàng B2B, Pipeline Bất Động Sản...",
          required: true,
          validation: (v) => {
            if (!v) return "Tên Pipeline là bắt buộc";
            if (v.length < 2) return "Tên phải có ít nhất 2 ký tự";
            if (v.length > 100) return "Tên không được vượt quá 100 ký tự";
            return undefined;
          },
        },
        {
          name: "description",
          label: "Mô tả",
          type: "textarea",
          placeholder: "Mô tả mục đích của phễu bán hàng này...",
          rows: 3,
        },
      ],
    },
  ],
  submitLabel: "Lưu Pipeline",
  cancelLabel: "Hủy",
  showCancel: true,
};
