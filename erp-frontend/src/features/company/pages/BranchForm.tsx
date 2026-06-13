import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Building2, CreditCard, Loader2, MapPin, Save } from "lucide-react";
import {
  fetchBranch,
  createBranch,
  updateBranch,
  Branch,
  BranchPayload,
  BranchUpdatePayload,
} from "../branch.service";

interface Province {
  code: number;
  name: string;
  districts: District[];
}

interface District {
  code: number;
  name: string;
  wards: Ward[];
}

interface Ward {
  code: number;
  name: string;
}

interface Bank {
  id?: string | number;
  code: string;
  name: string;
  shortName: string;
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const data = (error as { response?: { data?: { message?: string; error?: string } } })?.response?.data;
  return data?.message || data?.error || fallback;
};

const normalizeOptionalText = (value?: string) => value?.trim() || "";

const buildBranchPayload = (form: Branch): BranchPayload => ({
  company_id: Number(form.company_id || 1),
  code: form.code.trim(),
  name: form.name.trim(),
  address: normalizeOptionalText(form.address),
  province: normalizeOptionalText(form.province),
  district: normalizeOptionalText(form.district),
  ward: normalizeOptionalText(form.ward),
  tax_code: normalizeOptionalText(form.tax_code),
  bank_account: normalizeOptionalText(form.bank_account),
  bank_name: normalizeOptionalText(form.bank_name),
  status: form.status || "active",
});

const buildBranchUpdatePayload = (form: Branch): BranchUpdatePayload => {
  const payload = buildBranchPayload(form) as BranchUpdatePayload & { company_id?: number };
  delete payload.company_id;
  return payload;
};

export default function BranchForm({ mode }: { mode: "create" | "edit" }) {
  const nav = useNavigate();
  const { id } = useParams();
  const isCreate = mode === "create";

  const [form, setForm] = useState<Branch>({
    company_id: 1,
    code: "",
    name: "",
    address: "",
    province: "",
    district: "",
    ward: "",
    tax_code: "",
    bank_account: "",
    bank_name: "",
    status: "active",
  });

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | "">("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | "">("");

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const provinceResponse = await fetch("https://provinces.open-api.vn/api/?depth=3");
        const provinceData: Province[] = await provinceResponse.json();
        setProvinces(provinceData);

        const bankResponse = await fetch("https://api.vietqr.io/v2/banks");
        const bankJson = await bankResponse.json();
        setBanks(bankJson.data || []);
      } catch (error) {
        console.error("Không thể tải dữ liệu địa lý/ngân hàng:", error);
        toast.error("Không thể tải danh sách tỉnh/thành hoặc ngân hàng.");
      }
    };

    loadMasterData();
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !id) return;

    const loadBranch = async () => {
      setLoading(true);
      try {
        const data = await fetchBranch(Number(id));
        setForm({
          company_id: data.company_id || 1,
          code: data.code,
          name: data.name,
          address: data.address || "",
          province: data.province || "",
          district: data.district || "",
          ward: data.ward || "",
          tax_code: data.tax_code || "",
          bank_account: data.bank_account || "",
          bank_name: data.bank_name || "",
          status: (data.status as "active" | "inactive") || "active",
          id: data.id,
        });
      } catch {
        toast.error("Không thể tải thông tin chi nhánh.");
      } finally {
        setLoading(false);
      }
    };

    loadBranch();
  }, [id, mode]);

  useEffect(() => {
    if (!provinces.length || !form.province) return;

    const province = provinces.find((item) => item.name === form.province);
    if (!province) return;

    setSelectedProvinceCode(province.code);
    setDistricts(province.districts || []);

    if (form.district) {
      const district = province.districts.find((item) => item.name === form.district);
      if (district) {
        setSelectedDistrictCode(district.code);
        setWards(district.wards || []);
      }
    }
  }, [provinces, form.province, form.district]);

  const handleProvinceChange = (value: string) => {
    const code = value ? Number(value) : "";
    setSelectedProvinceCode(code);
    setSelectedDistrictCode("");

    const province = provinces.find((item) => item.code === code);
    setDistricts(province?.districts || []);
    setWards([]);
    setForm((prev) => ({
      ...prev,
      province: province?.name || "",
      district: "",
      ward: "",
    }));
  };

  const handleDistrictChange = (value: string) => {
    const code = value ? Number(value) : "";
    setSelectedDistrictCode(code);

    const district = districts.find((item) => item.code === code);
    setWards(district?.wards || []);
    setForm((prev) => ({
      ...prev,
      district: district?.name || "",
      ward: "",
    }));
  };

  const handleWardChange = (value: string) => {
    const code = value ? Number(value) : "";
    const ward = wards.find((item) => item.code === code);
    setForm((prev) => ({ ...prev, ward: ward?.name || "" }));
  };

  const handleBankChange = (value: string) => {
    const bank = banks.find((item) => item.code === value || String(item.id) === value);
    setForm((prev) => ({ ...prev, bank_name: bank?.shortName || bank?.name || "" }));
  };

  const save = async () => {
    if (!form.code?.trim() || !form.name?.trim()) {
      toast.error("Vui lòng nhập mã và tên chi nhánh.");
      return;
    }

    setSaving(true);
    try {
      if (isCreate) {
        await createBranch(buildBranchPayload(form));
        toast.success("Tạo chi nhánh thành công.");
      } else if (id) {
        await updateBranch(Number(id), buildBranchUpdatePayload(form));
        toast.success("Cập nhật chi nhánh thành công.");
      }
      nav("/company/branches");
    } catch (err) {
      // Hiển thị message thật từ backend (vd: trùng mã chi nhánh) thay vì nuốt lỗi.
      toast.error(
        getApiErrorMessage(
          err,
          isCreate ? "Tạo chi nhánh thất bại." : "Cập nhật chi nhánh thất bại.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedWardCode = wards.find((ward) => ward.name === form.ward)?.code.toString() || "";
  const selectedBankValue =
    banks.find((bank) => bank.shortName === form.bank_name || bank.name === form.bank_name)?.code || "";

  if (loading) {
    return (
      <div className="page-container">
        <div className="erp-card py-16">
          <div className="flex items-center justify-center gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            <span>Đang tải thông tin chi nhánh...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <button
        onClick={() => nav("/company/branches")}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách
      </button>

      <div className="erp-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                {isCreate ? "Tạo chi nhánh" : "Cập nhật chi nhánh"}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Nhập thông tin chi nhánh, địa chỉ, mã số thuế và tài khoản ngân hàng
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-6">
          <FormSection title="Thông tin chung" icon={<Building2 className="w-4 h-4" />}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Mã công ty">
                <input
                  type="number"
                  className="h-9 w-full rounded-md border border-gray-300 bg-gray-100 px-3 text-sm text-gray-500 cursor-not-allowed"
                  value={form.company_id}
                  disabled
                />
              </Field>

              <Field label="Mã chi nhánh" required>
                <input
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value })}
                  placeholder="VD: HCM01"
                />
              </Field>

              <Field label="Tên chi nhánh" required className="md:col-span-2">
                <input
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="VD: Chi nhánh Hồ Chí Minh"
                />
              </Field>

              <Field label="Địa chỉ chi tiết" className="md:col-span-2">
                <input
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={form.address || ""}
                  onChange={(event) => setForm({ ...form, address: event.target.value })}
                  placeholder="Số nhà, tên đường..."
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Địa chỉ hành chính" icon={<MapPin className="w-4 h-4" />}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Tỉnh/Thành phố">
                <select
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={selectedProvinceCode}
                  onChange={(event) => handleProvinceChange(event.target.value)}
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Quận/Huyện">
                <select
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={selectedDistrictCode}
                  onChange={(event) => handleDistrictChange(event.target.value)}
                  disabled={!districts.length}
                >
                  <option value="">Chọn quận/huyện</option>
                  {districts.map((district) => (
                    <option key={district.code} value={district.code}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Phường/Xã">
                <select
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={selectedWardCode}
                  onChange={(event) => handleWardChange(event.target.value)}
                  disabled={!wards.length}
                >
                  <option value="">Chọn phường/xã</option>
                  {wards.map((ward) => (
                    <option key={ward.code} value={ward.code}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection title="Thuế và ngân hàng" icon={<CreditCard className="w-4 h-4" />}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Mã số thuế">
                <input
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={form.tax_code || ""}
                  onChange={(event) => setForm({ ...form, tax_code: event.target.value })}
                  placeholder="Mã số thuế"
                />
              </Field>

              {mode === "edit" && (
                <Field label="Trạng thái">
                  <select
                    className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={form.status || "active"}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as "active" | "inactive",
                      })
                    }
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Ngừng hoạt động</option>
                  </select>
                </Field>
              )}

              <Field label="Số tài khoản">
                <input
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={form.bank_account || ""}
                  onChange={(event) => setForm({ ...form, bank_account: event.target.value })}
                  placeholder="Số tài khoản ngân hàng"
                />
              </Field>

              <Field label="Ngân hàng">
                <select
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={selectedBankValue}
                  onChange={(event) => handleBankChange(event.target.value)}
                >
                  <option value="">Chọn ngân hàng</option>
                  {banks.map((bank) => (
                    <option key={bank.code || bank.id} value={bank.code || String(bank.id)}>
                      {bank.shortName || bank.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </FormSection>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={() => nav("/company/branches")}
            className="h-9 px-4 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-white transition-colors"
            disabled={saving}
          >
            Hủy
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-orange-500 px-4 text-sm font-medium text-white shadow-sm hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isCreate ? "Tạo chi nhánh" : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
        <span className="text-orange-500">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
