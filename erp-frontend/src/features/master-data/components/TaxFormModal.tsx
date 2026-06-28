import { useState, useEffect } from "react";
import { CreateTaxRateDto, Tax, UpdateTaxRateDto } from "../dto/tax.dto";
import { Button } from "../../../components/ui/Button";
import { FormInput } from "../../../components/ui/FormInput";
import { Alert } from "../../../components/ui/Alert";
import { AppliesTo, TaxType } from "../../../types/enum";
import { toDateInputValue } from "@/utils/time.helper";

interface Props {
  data: Tax | null;
  onClose: () => void;
  onSubmitCreate: (data: CreateTaxRateDto) => void;
  onSubmitUpdate: (id: number, data: UpdateTaxRateDto) => void;
}

export default function TaxFormModal({
  data,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: Props) {
  const isEdit = !!data?.id;
  const TAX_TYPE_OPTIONS: TaxType[] = [
    "VAT",
    "CIT",
    "PIT",
    "IMPORT",
    "EXPORT",
    "EXCISE",
    "ENVIRONMENTAL",
    "OTHER",
  ];
  const APPLIES_OPTIONS: AppliesTo[] = ["sale", "purchase", "both"];

  const [form, setForm] = useState<CreateTaxRateDto>({
    code: "",
    name: "",
    type: "VAT",
    rate: 0,
    applies_to: "both",
    // is_vat: false,  // Đã loại bỏ: sẽ tính tự động dựa trên type
    effective_date: "",
    expiry_date: undefined,  // Fix: undefined thay vì null
    status: "active",
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setForm({
        code: data.code,
        name: data.name,
        type: data.type,
        rate: data.rate,
        applies_to: data.applies_to,
        // is_vat: data.is_vat,  // Đã loại bỏ: sẽ tính lại trong handleSubmit
        effective_date: toDateInputValue(data.effective_date),
        expiry_date: toDateInputValue(data.expiry_date),
        status: data.status,
      });
    }
  }, [data]);

  const updateField = <K extends keyof CreateTaxRateDto>(
    field: K,
    value: CreateTaxRateDto[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.name || (!isEdit && !form.code) || !form.effective_date) {
      setError("Vui lòng nhập mã, tên và ngày hiệu lực!");
      return;
    }
    const isVat = form.type === "VAT";  // Tính tự động dựa trên type
    setError(null);

    if (isEdit) {
      const dto: UpdateTaxRateDto = {
        name: form.name,
        type: form.type,
        rate: form.rate,
        applies_to: form.applies_to,
        is_vat: isVat,
        effective_date: form.effective_date,
        expiry_date: form.expiry_date,  // Đã normalize thành undefined
        status: form.status,
      };
      onSubmitUpdate(data!.id, dto);
    } else {
      const dto: CreateTaxRateDto = {
        ...form,
        is_vat: isVat,
      };
      onSubmitCreate(dto);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-xl space-y-4">
        <h2 className="text-lg font-semibold">
          {isEdit ? "Sửa thuế suất" : "Thêm thuế suất"}
        </h2>

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}

        {/* RESPONSIVE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CODE */}
          <div className="md:col-span-2">
            <FormInput
              label="Mã thuế"
              required
              value={form.code}
              disabled={isEdit}
              onChange={(v) => updateField("code", v)}
            />
          </div>

          {/* NAME */}
          <div className="md:col-span-2">
            <FormInput
              label="Tên thuế"
              required
              value={form.name}
              onChange={(v) => updateField("name", v)}
            />
          </div>

          {/* RATE */}
          <FormInput
            label="Thuế suất (%)"
            type="number"
            value={String(form.rate)}
            onChange={(v) => updateField("rate", Number(v))}
          />

          {/* TAX TYPE */}
          <div>
            <label className="text-sm font-medium">Loại thuế</label>
            <select
              className="border p-2 w-full rounded mt-1"
              value={form.type}
              onChange={(e) => updateField("type", e.target.value as TaxType)}
            >
              {TAX_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {({
                    VAT: "Thuế giá trị gia tăng",
                    CIT: "Thuế thu nhập doanh nghiệp",
                    PIT: "Thuế thu nhập cá nhân",
                    IMPORT: "Thuế nhập khẩu",
                    EXPORT: "Thuế xuất khẩu",
                    EXCISE: "Thuế tiêu thụ đặc biệt",
                    ENVIRONMENTAL: "Thuế bảo vệ môi trường",
                    OTHER: "Thuế khác",
                  } as Record<TaxType, string>)[t]}
                </option>
              ))}
            </select>
          </div>

          {/* APPLIES TO */}
          <div>
            <label className="text-sm font-medium">Áp dụng cho</label>
            <select
              className="border p-2 w-full rounded mt-1"
              value={form.applies_to}
              onChange={(e) => updateField("applies_to", e.target.value as AppliesTo)}
            >
              {APPLIES_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a === "sale" ? "Bán hàng" : a === "purchase" ? "Mua hàng" : "Cả hai"}
                </option>
              ))}
            </select>
          </div>

          {/* STATUS */}
          <div>
            <label className="text-sm font-medium">Trạng thái</label>
            <select
              className="border p-2 w-full rounded mt-1"
              value={form.status}
              onChange={(e) =>
                updateField("status", e.target.value as "active" | "inactive")
              }
            >
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>

          {/* EFFECTIVE DATE */}
          <FormInput
            label="Ngày hiệu lực"
            type="date"
            required
            value={form.effective_date ?? ""}
            onChange={(v) => updateField("effective_date", v === "" ? undefined : v)}  // Fix: undefined thay vì null (nhưng vì required, ít dùng)
          />

          {/* EXPIRY DATE */}
          <FormInput
            label="Ngày hết hiệu lực"
            type="date"
            value={form.expiry_date ?? ""}
            onChange={(v) => updateField("expiry_date", v === "" ? undefined : v)}  // Fix: undefined thay vì null
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button variant="primary" onClick={handleSubmit}>Lưu</Button>
        </div>
      </div>
    </div>
  );
}
