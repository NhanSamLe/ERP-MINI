import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchBranch,
  createBranch,
  updateBranch,
  Branch,
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
  code: string;
  name: string;
  shortName: string;
}

export default function BranchForm({ mode }: { mode: "create" | "edit" }) {
  const nav = useNavigate();
  const { id } = useParams();

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

  // ====== dữ liệu địa lý / ngân hàng ======
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(
    null
  );
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | null>(
    null
  );

  // load provinces + banks
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        // provinces (depth=3 có luôn quận/phường)
        const provRes = await fetch("https://provinces.open-api.vn/api/?depth=3");
        const provData: Province[] = await provRes.json();
        setProvinces(provData);

        // banks
        const bankRes = await fetch("https://api.vietqr.io/v2/banks");
        const bankJson = await bankRes.json();
        setBanks(bankJson.data || []);
      } catch (err) {
        console.error("Failed to load provinces / banks", err);
      }
    };
    loadMasterData();
  }, []);

  // load branch khi edit
  useEffect(() => {
    if (mode === "edit" && id) {
      (async () => {
        setLoading(true);
        try {
          const data = await fetchBranch(Number(id));
          setForm({
            company_id: 1,
            code: data.code,
            name: data.name,
            address: data.address ?? "",
            province: data.province ?? "",
            district: data.district ?? "",
            ward: data.ward ?? "",
            tax_code: data.tax_code ?? "",
            bank_account: data.bank_account ?? "",
            bank_name: data.bank_name ?? "",
            status: (data.status as "active" | "inactive") ?? "active",
            id: data.id,
          });
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [id, mode]);

  // khi có provinces + form.province/district/ward (edit) -> set selected codes
  useEffect(() => {
    if (!provinces.length) return;

    if (form.province) {
      const p = provinces.find((x) => x.name === form.province);
      if (p) {
        setSelectedProvinceCode(p.code);
        setDistricts(p.districts || []);

        if (form.district) {
          const d = p.districts.find((x) => x.name === form.district);
          if (d) {
            setSelectedDistrictCode(d.code);
            setWards(d.wards || []);
          }
        }
      }
    }
  }, [provinces, form.province, form.district]);

  const handleProvinceChange = (codeStr: string) => {
    const code = Number(codeStr);
    setSelectedProvinceCode(code);
    const p = provinces.find((x) => x.code === code);
    setDistricts(p?.districts || []);
    setWards([]);
    setSelectedDistrictCode(null);

    setForm((prev) => ({
      ...prev,
      province: p?.name || "",
      district: "",
      ward: "",
    }));
  };

  const handleDistrictChange = (codeStr: string) => {
    const code = Number(codeStr);
    setSelectedDistrictCode(code);
    const d = districts.find((x) => x.code === code);
    setWards(d?.wards || []);

    setForm((prev) => ({
      ...prev,
      district: d?.name || "",
      ward: "",
    }));
  };

  const handleWardChange = (codeStr: string) => {
    const code = Number(codeStr);
    const w = wards.find((x) => x.code === code);
    setForm((prev) => ({ ...prev, ward: w?.name || "" }));
  };

  const handleBankChange = (code: string) => {
    const b = banks.find((x) => x.code === code);
    setForm((prev) => ({ ...prev, bank_name: b?.shortName || b?.name || "" }));
  };

  const save = async () => {
    if (!form.code?.trim() || !form.name?.trim()) {
      alert("Code & Name are required");
      return;
    }
    if (mode === "create") {
      await createBranch(form);
    } else if (id) {
      await updateBranch(Number(id), form);
    }
    nav("/company/branches");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {mode === "create" ? "Create Branch" : "Edit Branch"}
          </h1>
          <p className="text-sm text-gray-500">
            Nhập thông tin chi nhánh và thông tin ngân hàng.
          </p>
        </div>
      </div>

      {/* General Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
  <label className="block text-sm text-gray-600 mb-1">Company ID</label>
  <input
    type="number"
    className="w-full border rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"
    value={1}             
    disabled             
  />
</div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Code</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="VD: HCM01"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Name</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="VD: HCM Main Branch"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Address</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.address ?? ""}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Số nhà, đường..."
          />
        </div>
      </div>

      {/* Địa chỉ chi tiết */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Tỉnh / Thành phố
          </label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={selectedProvinceCode ?? ""}
            onChange={(e) => handleProvinceChange(e.target.value)}
          >
            <option value="">Chọn tỉnh/thành</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Quận / Huyện
          </label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={selectedDistrictCode ?? ""}
            onChange={(e) => handleDistrictChange(e.target.value)}
            disabled={!districts.length}
          >
            <option value="">Chọn quận/huyện</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Phường / Xã</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={
              wards.find((w) => w.name === form.ward)?.code.toString() || ""
            }
            onChange={(e) => handleWardChange(e.target.value)}
            disabled={!wards.length}
          >
            <option value="">Chọn phường/xã</option>
            {wards.map((w) => (
              <option key={w.code} value={w.code}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Tax Code</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.tax_code ?? ""}
            onChange={(e) => setForm({ ...form, tax_code: e.target.value })}
            placeholder="Mã số thuế"
          />
        </div>
      </div>

      {/* Thông tin ngân hàng */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Bank Account
          </label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.bank_account ?? ""}
            onChange={(e) =>
              setForm({ ...form, bank_account: e.target.value })
            }
            placeholder="Số tài khoản"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Bank Name</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={
              banks.find(
                (b) => b.shortName === form.bank_name || b.name === form.bank_name
              )?.code || ""
            }
            onChange={(e) => handleBankChange(e.target.value)}
          >
            <option value="">Chọn ngân hàng</option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>
                {b.shortName || b.name}
              </option>
            ))}
          </select>
        </div>

        {mode === "edit" && (
          <div>
            <label className="block text-sm text-gray-600 mb-1">Status</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.status ?? "active"}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as "active" | "inactive",
                })
              }
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {mode === "create" ? "Create" : "Save changes"}
        </button>
        <button
          onClick={() => nav("/company/branches")}
          className="border px-4 py-2 rounded-lg text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
