import { FormConfig } from "@/components/v2/forms";
import { CreateLeadSourceDto, UpdateLeadSourceDto } from "../dto/leadSource.dto";

export const leadSourceFormConfig: FormConfig<CreateLeadSourceDto | UpdateLeadSourceDto> = {
  sections: [
    {
      title: "Thông tin nguồn Lead",
      columns: 1,
      fields: [
        {
          name: "name",
          label: "Tên nguồn",
          type: "text",
          placeholder: "VD: Website, Facebook, Google Ads...",
          required: true,
          validation: (v) => {
            if (!v) return "Tên nguồn là bắt buộc";
            if (v.length < 2) return "Tên nguồn phải có ít nhất 2 ký tự";
            if (v.length > 100) return "Tên nguồn không được vượt quá 100 ký tự";
            return undefined;
          },
        },
        {
          name: "description",
          label: "Mô tả",
          type: "textarea",
          placeholder: "Mô tả ngắn gọn về nguồn khách hàng này...",
          rows: 3,
        },
      ],
    },
  ],
  submitLabel: "Lưu",
  cancelLabel: "Hủy",
  showCancel: true,
};
