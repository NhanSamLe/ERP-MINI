import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { toast } from "react-toastify";
import { Save, RefreshCw, Settings, Building2, BookOpen } from "lucide-react";
import { financeConfigApi, AccountMappingDTO } from "../api/finance.api";
import { glAccountApi } from "../api/glAccount.api";
import { GlAccountDTO } from "../dto/glAccount.dto";

const SYSTEM_MAPPING_KEYS = [
  {
    key: "AR_RECEIVABLE",
    label: "Tài khoản phải thu khách hàng",
    defaultCode: "131",
    description: "Tài khoản ghi Nợ phải thu khi lập hóa đơn bán hàng (AR Invoice).",
  },
  {
    key: "AR_REVENUE",
    label: "Tài khoản doanh thu",
    defaultCode: "511",
    description: "Tài khoản ghi Có doanh thu bán hàng khi lập hóa đơn bán hàng.",
  },
  {
    key: "AR_VAT",
    label: "Tài khoản thuế GTGT đầu ra",
    defaultCode: "3331",
    description: "Tài khoản ghi nhận thuế GTGT phải nộp từ hóa đơn bán hàng.",
  },
  {
    key: "AP_PAYABLE",
    label: "Tài khoản phải trả nhà cung cấp",
    defaultCode: "331",
    description: "Tài khoản ghi Có phải trả khi lập hóa đơn mua hàng (AP Invoice).",
  },
  {
    key: "AP_EXPENSE_INVENTORY",
    label: "Tài khoản chi phí / hàng tồn kho",
    defaultCode: "156",
    description: "Tài khoản ghi Nợ giá trị hàng mua hoặc chi phí mua hàng.",
  },
  {
    key: "AP_VAT",
    label: "Tài khoản thuế GTGT đầu vào",
    defaultCode: "1331",
    description: "Tài khoản ghi nhận thuế GTGT được khấu trừ từ hóa đơn mua.",
  },
];

const AccountMappingPage: React.FC = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  const branches = useSelector((s: RootState) => s.branch.branches || []);

  const [selectedBranchId, setSelectedBranchId] = useState<number | "">("");
  const [accounts, setAccounts] = useState<GlAccountDTO[]>([]);
  const [mappings, setMappings] = useState<AccountMappingDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, number>>({});

  // Initialize selected branch based on user profile
  useEffect(() => {
    if (user?.branch_id) {
      setSelectedBranchId(user.branch_id);
    } else if (branches.length > 0) {
      setSelectedBranchId(branches[0].id);
    }
  }, [user, branches]);

  // Load GL Accounts
  const loadAccounts = async () => {
    try {
      const res = await glAccountApi.getAll();
      setAccounts(res.data);
    } catch (e: any) {
      console.error(e);
      toast.error("Không thể tải danh sách tài khoản kế toán");
    }
  };

  // Load Mappings for selected branch
  const loadMappings = async (branchId: number) => {
    try {
      setLoading(true);
      const res = await financeConfigApi.getAccountMappings({ branch_id: branchId });
      setMappings(res.data);

      const initialValues: Record<string, number> = {};
      res.data.forEach((m) => {
        initialValues[m.mapping_key] = m.account_id;
      });
      setFormValues(initialValues);
    } catch (e: any) {
      console.error(e);
      toast.error("Không thể tải cấu hình định khoản");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      loadMappings(Number(selectedBranchId));
    }
  }, [selectedBranchId]);

  const handleSelectAccount = (key: string, accountId: number) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: accountId,
    }));
  };

  const handleSaveMapping = async (key: string) => {
    if (!selectedBranchId) {
      toast.warning("Vui lòng chọn chi nhánh trước");
      return;
    }
    const accountId = formValues[key];
    if (!accountId) {
      toast.warning("Vui lòng chọn tài khoản kế toán");
      return;
    }

    try {
      setSavingKey(key);
      const sysKey = SYSTEM_MAPPING_KEYS.find((item) => item.key === key);
      await financeConfigApi.upsertAccountMapping({
        branch_id: Number(selectedBranchId),
        mapping_key: key,
        account_id: accountId,
        description: sysKey?.label || "",
      });
      toast.success(`Cập nhật cấu hình "${sysKey?.label}" thành công!`);
      // Reload mappings to refresh model states
      await loadMappings(Number(selectedBranchId));
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Cập nhật cấu hình thất bại");
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveAll = async () => {
    if (!selectedBranchId) {
      toast.warning("Vui lòng chọn chi nhánh trước");
      return;
    }
    try {
      setLoading(true);
      const promises = SYSTEM_MAPPING_KEYS.map((item) => {
        const accountId = formValues[item.key];
        if (accountId) {
          return financeConfigApi.upsertAccountMapping({
            branch_id: Number(selectedBranchId),
            mapping_key: item.key,
            account_id: accountId,
            description: item.label,
          });
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
      toast.success("Đã cập nhật toàn bộ cấu hình định khoản chi nhánh!");
      await loadMappings(Number(selectedBranchId));
    } catch (e: any) {
      console.error(e);
      toast.error("Cập nhật hàng loạt thất bại");
    } finally {
      setLoading(false);
    }
  };

  const isAdminOrCEO = user?.role.code === "ADMIN" || user?.role.code === "CEO";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Cấu hình định khoản tự động</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Thiết lập tài khoản kế toán mặc định cho các giao dịch bán hàng, mua hàng và thanh toán.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => selectedBranchId && loadMappings(Number(selectedBranchId))}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-700 text-sm font-medium transition-all shadow-sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Làm mới
              </button>
              <button
                onClick={handleSaveAll}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-indigo-500/20"
                disabled={loading}
              >
                <Save className="w-4 h-4" />
                Lưu tất cả
              </button>
            </div>
          </div>
        </div>

        {/* Branch Selector */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2 text-slate-700 font-medium shrink-0">
            <Building2 className="w-5 h-5 text-indigo-500" />
            <span>Chi nhánh áp dụng:</span>
          </div>
          <div className="flex-1 max-w-md">
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              disabled={!isAdminOrCEO}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} - {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Config Settings Grid */}
        <div className="grid grid-cols-1 gap-6">
          {SYSTEM_MAPPING_KEYS.map((sysKey) => {
            const currentAccountId = formValues[sysKey.key] || "";
            const isSaving = savingKey === sysKey.key;
            
            return (
              <div
                key={sysKey.key}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-all"
              >
                {/* Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-mono text-xs font-semibold">
                      {sysKey.key}
                    </span>
                    <span className="text-slate-400 text-xs">
                      Mặc định: {sysKey.defaultCode}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800">{sysKey.label}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{sysKey.description}</p>
                </div>

                {/* Dropdown & Save */}
                <div className="w-full md:w-auto flex items-center gap-3 shrink-0">
                  <div className="flex-1 md:w-72">
                    <select
                      value={currentAccountId}
                      onChange={(e) => handleSelectAccount(sysKey.key, Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium"
                    >
                      <option value="">-- Chọn tài khoản kế toán --</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleSaveMapping(sysKey.key)}
                    disabled={isSaving}
                    className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 rounded-xl transition-all shadow-sm disabled:opacity-50"
                    title="Lưu dòng cấu hình này"
                  >
                    {isSaving ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AccountMappingPage;
