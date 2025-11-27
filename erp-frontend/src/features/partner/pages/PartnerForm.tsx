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

// ==== types cho API địa chỉ & ngân hàng ====
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

  // ====== state cho combobox địa chỉ & ngân hàng ======
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [banks, setBanks] = useState<BankItem[]>([]);

  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | "">(
    ""
  );
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | "">(
    ""
  );

  // ====== load partner khi edit ======
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

  // ====== load provinces + banks lúc mở form ======
  useEffect(() => {
    // provinces
    axios
      .get<Province[]>("https://provinces.open-api.vn/api/p/")
      .then((res) => {
        setProvinces(res.data || []);
      })
      .catch((err) => console.error("Load provinces error:", err));

    // banks
    axios
      .get<BankResponse>("https://api.vietqr.io/v2/banks")
      .then((res) => {
        setBanks(res.data?.data || []);
      })
      .catch((err) => console.error("Load banks error:", err));
  }, []);

  // ====== khi chọn tỉnh => load quận ======
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

  // ====== khi chọn quận => load phường ======
  useEffect(() => {
    if (!selectedDistrictCode) {
      setWards([]);
      return;
    }

    axios
      .get<DistrictWithWards>(
        `https://provinces.open-api.vn/api/d/${selectedDistrictCode}?depth=2`
      )
      .then((res) => {
        setWards(res.data.wards || []);
      })
      .catch((err) => console.error("Load wards error:", err));
  }, [selectedDistrictCode]);

  // ====== handle change input thường ======
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ====== handle chọn tỉnh ======
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

  // ====== handle chọn quận ======
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

  // ====== handle chọn phường ======
  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value ? Number(e.target.value) : "";
    const ward = wards.find((w) => w.code === code);
    setForm((prev) => ({
      ...prev,
      ward: ward ? ward.name : "",
    }));
  };

  // ====== handle chọn ngân hàng ======
  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bankId = e.target.value;
    const bank = banks.find((b) => b.id === bankId);
    setForm((prev) => ({
      ...prev,
      bank_name: bank ? bank.name : "",
    }));
  };

  // ====== submit ======
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.type) {
      alert("Vui lòng nhập tên và loại đối tác");
      return;
    }

    if (isEdit && id) {
      await dispatch(updatePartnerThunk({ id: Number(id), data: form }));
    } else {
      await dispatch(createPartnerThunk(form));
    }
    navigate("/partners");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        {isEdit ? "Cập nhật đối tác" : "Thêm đối tác mới"}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
        {/* Loại + Trạng thái */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loại đối tác
          </label>
          <select
            name="type"
            className="border w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={form.type as PartnerType}
            onChange={handleChange}
          >
            <option value="customer">Khách hàng</option>
            <option value="supplier">Nhà cung cấp</option>
            <option value="internal">Nội bộ</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trạng thái
          </label>
          <select
            name="status"
            className="border w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={form.status as PartnerStatus}
            onChange={handleChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Tên & người liên hệ */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên đối tác
          </label>
          <input
            name="name"
            className="border w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={form.name || ""}
            onChange={handleChange}
            placeholder="VD: Nguyễn Văn A, Công ty ABC..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Người liên hệ
          </label>
          <input
            name="contact_person"
            className="border w-full px-3 py-2 rounded-md text-sm"
            value={form.contact_person || ""}
            onChange={handleChange}
            placeholder="VD: Nguyễn Văn B"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số điện thoại
          </label>
          <input
            name="phone"
            className="border w-full px-3 py-2 rounded-md text-sm"
            value={form.phone || ""}
            onChange={handleChange}
            placeholder="VD: 0909xxx..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            name="email"
            className="border w-full px-3 py-2 rounded-md text-sm"
            value={form.email || ""}
            onChange={handleChange}
            placeholder="VD: customer@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mã số thuế
          </label>
          <input
            name="tax_code"
            className="border w-full px-3 py-2 rounded-md text-sm"
            value={form.tax_code || ""}
            onChange={handleChange}
            placeholder="VD: 0312xxxxxx"
          />
        </div>

        {/* Địa chỉ chi tiết */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Địa chỉ (số nhà, đường)
          </label>
          <input
            name="address"
            className="border w-full px-3 py-2 rounded-md text-sm"
            value={form.address || ""}
            onChange={handleChange}
            placeholder="VD: 123 Lê Lợi"
          />
        </div>

        {/* Tỉnh / Quận / Phường */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tỉnh / Thành phố
          </label>
          <select
            className="border w-full px-3 py-2 rounded-md text-sm"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quận / Huyện
          </label>
          <select
            className="border w-full px-3 py-2 rounded-md text-sm"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phường / Xã
          </label>
          <select
            className="border w-full px-3 py-2 rounded-md text-sm"
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

        {/* Ngân hàng + số tài khoản */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số tài khoản ngân hàng
          </label>
          <input
            name="bank_account"
            className="border w-full px-3 py-2 rounded-md text-sm"
            value={form.bank_account || ""}
            onChange={handleChange}
            placeholder="Số tài khoản"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngân hàng
          </label>
          <select
            className="border w-full px-3 py-2 rounded-md text-sm"
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

        {/* Buttons */}
        <div className="col-span-2 flex justify-end gap-3 mt-4">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => navigate("/partners")}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
          >
            {isEdit ? "Cập nhật" : "Lưu"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PartnerForm;
