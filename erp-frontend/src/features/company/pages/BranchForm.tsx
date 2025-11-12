import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchBranch,
  createBranch,
  updateBranch,
  Branch,
} from "../branch.service";

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

  useEffect(() => {
    if (mode === "edit" && id) {
      (async () => {
        setLoading(true);
        try {
          const data = await fetchBranch(Number(id));
          setForm({
            company_id: data.company_id,
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
    <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-6">
      <h1 className="text-xl font-bold mb-4">
        {mode === "create" ? "Create Branch" : "Edit Branch"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Company ID</label>
          <input
            type="number"
            className="w-full border rounded-lg px-3 py-2"
            value={form.company_id}
            onChange={(e) =>
              setForm({ ...form, company_id: Number(e.target.value) })
            }
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Code</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Name</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Address</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={form.address ?? ""}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Province</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={form.province ?? ""}
            onChange={(e) => setForm({ ...form, province: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">District</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={form.district ?? ""}
            onChange={(e) => setForm({ ...form, district: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Ward</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={form.ward ?? ""}
            onChange={(e) => setForm({ ...form, ward: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Tax Code</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={form.tax_code ?? ""}
            onChange={(e) => setForm({ ...form, tax_code: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Bank Account</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={form.bank_account ?? ""}
            onChange={(e) =>
              setForm({ ...form, bank_account: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Bank Name</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={form.bank_name ?? ""}
            onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
          />
        </div>

        {mode === "edit" && (
          <div>
            <label className="block text-sm text-gray-600 mb-1">Status</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
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

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={save}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
        >
          {mode === "create" ? "Create" : "Save changes"}
        </button>
        <button
          onClick={() => nav("/company/branches")}
          className="border px-4 py-2 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
