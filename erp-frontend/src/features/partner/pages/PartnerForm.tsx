import { FC, useEffect, useState, FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import {
  createPartnerThunk,
  loadPartnerDetail,
  updatePartnerThunk,
} from "../store/partner.thunks";
import { Partner, PartnerType, PartnerStatus } from "../store/partner.types";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  CreditCard, 
  FileText,
  ArrowLeft,
  Save,
  Loader2
} from "lucide-react";

type Province = { code: number; name: string };
type District = { code: number; name: string };
type Ward = { code: number; name: string };

interface ProvinceWithDistricts {
  code: number;
  name: string;
  districts: District[];
}

interface DistrictWithWards {
  code: number;
  name: string;
  wards: Ward[];
}

interface BankItem {
  id: string;
  name: string;
  shortName: string;
}

interface BankResponse {
  code: string;
  data: BankItem[];
}

const PartnerForm: FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { selected } = useSelector((s: RootState) => s.partners);

  const [form, setForm] = useState<Partial<Partner>>({
    type: "customer",
    status: "active",
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [banks, setBanks] = useState<BankItem[]>([]);

  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | "">("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | "">("");
  
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && id) {
      dispatch(loadPartnerDetail(Number(id)));
    }
  }, [dispatch, id, isEdit]);

  useEffect(() => {
    if (isEdit && selected) {
      setForm(selected);
    }
  }, [selected, isEdit]);

  useEffect(() => {
    axios
      .get<Province[]>("https://provinces.open-api.vn/api/p/")
      .then((res) => setProvinces(res.data || []))
      .catch((err) => console.error("Load provinces error:", err));

    axios
      .get<BankResponse>("https://api.vietqr.io/v2/banks")
      .then((res) => setBanks(res.data?.data || []))
      .catch((err) => console.error("Load banks error:", err));
  }, []);

  useEffect(() => {
    if (!selectedProvinceCode) {
      setDistricts([]);
      setWards([]);
      setSelectedDistrictCode("");
      return;
    }

    axios
      .get<ProvinceWithDistricts>(
        `https://provinces.open-api.vn/api/p/${selectedProvinceCode}?depth=2`
      )
      .then((res) => {
        setDistricts(res.data.districts || []);
        setWards([]);
        setSelectedDistrictCode("");
      })
      .catch((err) => console.error("Load districts error:", err));
  }, [selectedProvinceCode]);

  useEffect(() => {
    if (!selectedDistrictCode) {
      setWards([]);
      return;
    }

    axios
      .get<DistrictWithWards>(
        `https://provinces.open-api.vn/api/d/${selectedDistrictCode}?depth=2`
      )
      .then((res) => setWards(res.data.wards || []))
      .catch((err) => console.error("Load wards error:", err));
  }, [selectedDistrictCode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value ? Number(e.target.value) : "";
    setSelectedProvinceCode(code);

    const province = provinces.find((p) => p.code === code);
    setForm((prev) => ({
      ...prev,
      province: province ? province.name : "",
      district: "",
      ward: "",
    }));
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value ? Number(e.target.value) : "";
    setSelectedDistrictCode(code);

    const district = districts.find((d) => d.code === code);
    setForm((prev) => ({
      ...prev,
      district: district ? district.name : "",
      ward: "",
    }));
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value ? Number(e.target.value) : "";
    const ward = wards.find((w) => w.code === code);
    setForm((prev) => ({
      ...prev,
      ward: ward ? ward.name : "",
    }));
  };

  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bankId = e.target.value;
    const bank = banks.find((b) => b.id === bankId);
    setForm((prev) => ({
      ...prev,
      bank_name: bank ? bank.name : "",
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.name?.trim()) {
      newErrors.name = "Vui lòng nhập tên đối tác";
    }
    
    if (!form.type) {
      newErrors.type = "Vui lòng chọn loại đối tác";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (form.phone && !/^[0-9]{10,11}$/.test(form.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      if (isEdit && id) {
        await dispatch(updatePartnerThunk({ id: Number(id), data: form }));
      } else {
        await dispatch(createPartnerThunk(form));
      }
      navigate("/partners");
    } catch (error) {
      console.error("Error saving partner:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/partners")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại danh sách</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Building2 className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                {isEdit ? "Cập nhật đối tác" : "Thêm đối tác mới"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isEdit 
                  ? "Chỉnh sửa thông tin đối tác hiện tại" 
                  : "Điền thông tin để tạo đối tác mới"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thông tin cơ bản */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-orange-600" />
              Thông tin cơ bản
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Loại đối tác */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại đối tác <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.type ? "border-red-500" : "border-gray-300"
                  }`}
                  value={form.type as PartnerType}
                  onChange={handleChange}
                >
                  <option value="customer">Khách hàng</option>
                  <option value="supplier">Nhà cung cấp</option>
                  <option value="internal">Nội bộ</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-xs text-red-500">{errors.type}</p>
                )}
              </div>

              {/* Trạng thái */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  value={form.status as PartnerStatus}
                  onChange={handleChange}
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
              </div>

              {/* Tên đối tác */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên đối tác <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  value={form.name || ""}
                  onChange={handleChange}
                  placeholder="VD: Công ty TNHH ABC, Nguyễn Văn A..."
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Mã số thuế */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Mã số thuế
                </label>
                <input
                  name="tax_code"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  value={form.tax_code || ""}
                  onChange={handleChange}
                  placeholder="VD: 0312xxxxxx"
                />
              </div>

              {/* CCCD */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  CCCD / CMND
                </label>
                <input
                  name="cccd"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  value={form.cccd || ""}
                  onChange={handleChange}
                  placeholder="VD: 001234567890"
                />
              </div>
            </div>
          </div>

          {/* Thông tin liên hệ */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-orange-600" />
              Thông tin liên hệ
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Người liên hệ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Người liên hệ
                </label>
                <input
                  name="contact_person"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  value={form.contact_person || ""}
                  onChange={handleChange}
                  placeholder="VD: Nguyễn Văn B"
                />
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  Số điện thoại
                </label>
                <input
                  name="phone"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                  value={form.phone || ""}
                  onChange={handleChange}
                  placeholder="VD: 0909123456"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  value={form.email || ""}
                  onChange={handleChange}
                  placeholder="VD: contact@company.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Địa chỉ */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              Địa chỉ
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tỉnh */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tỉnh / Thành phố
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  value={selectedProvinceCode || ""}
                  onChange={handleProvinceChange}
                >
                  <option value="">Chọn tỉnh / thành</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quận */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quận / Huyện
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={selectedDistrictCode || ""}
                  onChange={handleDistrictChange}
                  disabled={!selectedProvinceCode}
                >
                  <option value="">Chọn quận / huyện</option>
                  {districts.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phường */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phường / Xã
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={
                    wards.find((w) => w.name === form.ward)?.code?.toString() || ""
                  }
                  onChange={handleWardChange}
                  disabled={!selectedDistrictCode}
                >
                  <option value="">Chọn phường / xã</option>
                  {wards.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Địa chỉ chi tiết */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ chi tiết (Số nhà, tên đường)
                </label>
                <input
                  name="address"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  value={form.address || ""}
                  onChange={handleChange}
                  placeholder="VD: 123 Lê Lợi"
                />
              </div>
            </div>
          </div>

          {/* Thông tin ngân hàng */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-600" />
              Thông tin ngân hàng
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Số tài khoản */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tài khoản
                </label>
                <input
                  name="bank_account"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  value={form.bank_account || ""}
                  onChange={handleChange}
                  placeholder="VD: 1234567890"
                />
              </div>

              {/* Ngân hàng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngân hàng
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  value={
                    banks.find((b) => b.name === form.bank_name)?.id?.toString() || ""
                  }
                  onChange={handleBankChange}
                >
                  <option value="">Chọn ngân hàng</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.shortName || b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => navigate("/partners")}
              disabled={saving}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? "Cập nhật" : "Lưu đối tác"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PartnerForm;