import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import {
  BarChart3,
  CheckCircle,
  Building2,
  Calculator,
  Package,
  Users,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  setupApi,
  CompanyInfoPayload,
  FinanceConfigPayload,
  WarehouseConfigPayload,
  HRConfigPayload,
  InviteMember,
} from '../api/setup.api';

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Công ty', icon: Building2 },
  { id: 2, label: 'Tài chính', icon: Calculator },
  { id: 3, label: 'Kho hàng', icon: Package },
  { id: 4, label: 'Nhân sự', icon: Users },
  { id: 5, label: 'Thành viên', icon: UserPlus },
];

const VAS_ACCOUNTS = [
  { code: '111', name: 'Tiền mặt' },
  { code: '112', name: 'Tiền gửi ngân hàng' },
  { code: '131', name: 'Phải thu khách hàng' },
  { code: '331', name: 'Phải trả người bán' },
  { code: '511', name: 'Doanh thu bán hàng' },
  { code: '632', name: 'Giá vốn hàng bán' },
  { code: '811', name: 'Chi phí khác' },
];

// ─── Shared UI helpers ────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  required?: boolean;
  helper?: string;
  children: React.ReactNode;
}

function Field({ label, required, helper, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      {children}
      {helper && <p className="text-xs text-gray-400">{helper}</p>}
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 hover:border-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-colors';

const selectCls = inputCls;

// ─── Step components ──────────────────────────────────────────────────────────

// Step 1
interface Step1Props {
  onSave: (data: CompanyInfoPayload, logo?: File) => Promise<void>;
  loading: boolean;
  error: string | null;
}

function Step1Company({ onSave, loading, error }: Step1Props) {
  const [form, setForm] = useState<CompanyInfoPayload>({
    company_name: '',
    address: '',
    website: '',
    phone: '',
    email: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof CompanyInfoPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form, logoFile ?? undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Thông tin công ty
        </h2>
        <p className="text-sm text-gray-500">
          Cập nhật hồ sơ doanh nghiệp để bắt đầu sử dụng hệ thống
        </p>
      </div>

      {/* Logo upload */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Logo công ty
        </label>
        <div className="flex items-center gap-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 border-2 border-dashed border-gray-300 hover:border-orange-400 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden transition-colors"
          >
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <Upload className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              Tải lên logo
            </button>
            <p className="text-xs text-gray-400 mt-0.5">PNG, JPG tối đa 5MB</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleLogoChange}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Field label="Tên công ty" required>
            <input
              type="text"
              value={form.company_name}
              onChange={update('company_name')}
              placeholder="Công ty TNHH ABC"
              className={inputCls}
              required
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Địa chỉ">
            <input
              type="text"
              value={form.address}
              onChange={update('address')}
              placeholder="Địa chỉ trụ sở chính"
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Website">
          <input
            type="url"
            value={form.website}
            onChange={update('website')}
            placeholder="https://company.com"
            className={inputCls}
          />
        </Field>
        <Field label="Số điện thoại">
          <input
            type="tel"
            value={form.phone}
            onChange={update('phone')}
            placeholder="0xxx xxx xxx"
            className={inputCls}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Email liên hệ">
            <input
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="contact@company.com"
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <StepFooter loading={loading} isFirst />
    </form>
  );
}

// Step 2
interface Step2Props {
  onSave: (data: FinanceConfigPayload) => Promise<void>;
  loading: boolean;
  error: string | null;
  onBack: () => void;
}

function Step2Finance({ onSave, loading, error, onBack }: Step2Props) {
  const [form, setForm] = useState<FinanceConfigPayload>({
    fiscal_year_start_month: 1,
    currency: 'VND',
    bank_name: '',
    bank_account: '',
  });

  const update =
    <K extends keyof FinanceConfigPayload>(field: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val =
        field === 'fiscal_year_start_month'
          ? Number(e.target.value)
          : e.target.value;
      setForm((prev) => ({ ...prev, [field]: val }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Cấu hình tài chính
        </h2>
        <p className="text-sm text-gray-500">
          Thiết lập năm tài chính và đơn vị tiền tệ
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Năm tài chính bắt đầu từ tháng" required>
          <select
            value={form.fiscal_year_start_month}
            onChange={update('fiscal_year_start_month')}
            className={selectCls}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Đơn vị tiền tệ chính" required>
          <select
            value={form.currency}
            onChange={update('currency')}
            className={selectCls}
          >
            <option value="VND">VND — Việt Nam Đồng</option>
            <option value="USD">USD — Đô la Mỹ</option>
            <option value="EUR">EUR — Euro</option>
          </select>
        </Field>

        <Field label="Ngân hàng">
          <input
            type="text"
            value={form.bank_name}
            onChange={update('bank_name')}
            placeholder="VD: Vietcombank"
            className={inputCls}
          />
        </Field>

        <Field label="Số tài khoản ngân hàng">
          <input
            type="text"
            value={form.bank_account}
            onChange={update('bank_account')}
            placeholder="VD: 0123456789"
            className={inputCls}
          />
        </Field>
      </div>

      {/* VAS accounts preview */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
        <p className="text-sm font-medium text-orange-800 mb-3">
          Danh mục tài khoản đã được tạo sẵn theo chuẩn VAS
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {VAS_ACCOUNTS.map((acc) => (
            <div key={acc.code} className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
              <span className="text-gray-600">
                <span className="font-medium text-gray-800">{acc.code}</span>{' '}
                {acc.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <StepFooter loading={loading} onBack={onBack} />
    </form>
  );
}

// Step 3
interface Step3Props {
  onSave: (data: WarehouseConfigPayload) => Promise<void>;
  loading: boolean;
  error: string | null;
  onBack: () => void;
}

function Step3Warehouse({ onSave, loading, error, onBack }: Step3Props) {
  const [form, setForm] = useState<WarehouseConfigPayload>({
    warehouse_name: 'Kho chính',
    warehouse_code: 'WH-MAIN',
    track_lot_serial: false,
    costing_method: 'WAC',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Cấu hình kho hàng
        </h2>
        <p className="text-sm text-gray-500">
          Thiết lập kho mặc định và phương pháp tính giá vốn
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Tên kho mặc định" required>
          <input
            type="text"
            value={form.warehouse_name}
            onChange={(e) =>
              setForm((p) => ({ ...p, warehouse_name: e.target.value }))
            }
            className={inputCls}
          />
        </Field>

        <Field label="Mã kho" required>
          <input
            type="text"
            value={form.warehouse_code}
            onChange={(e) =>
              setForm((p) => ({ ...p, warehouse_code: e.target.value }))
            }
            className={inputCls}
          />
        </Field>
      </div>

      {/* Toggle: lot/serial tracking */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-800">
            Quản lý theo lô / hạn sử dụng
          </p>
          <p className="text-xs text-gray-500">
            Theo dõi số lô (lot) và hạn sử dụng cho từng sản phẩm
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setForm((p) => ({ ...p, track_lot_serial: !p.track_lot_serial }))
          }
          className={[
            'relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
            form.track_lot_serial ? 'bg-orange-500' : 'bg-gray-300',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
              form.track_lot_serial ? 'translate-x-5' : 'translate-x-0',
            ].join(' ')}
          />
        </button>
      </div>

      {/* Costing method radio */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">
          Phương pháp tính giá vốn
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {(
            [
              {
                value: 'WAC',
                label: 'Bình quân gia quyền (WAC)',
                desc: 'Phổ biến nhất tại Việt Nam',
              },
              {
                value: 'FIFO',
                label: 'Nhập trước xuất trước (FIFO)',
                desc: 'Phù hợp hàng hóa có hạn sử dụng',
              },
            ] as const
          ).map((opt) => (
            <label
              key={opt.value}
              className={[
                'flex items-start gap-3 border rounded-xl p-4 cursor-pointer transition-colors',
                form.costing_method === opt.value
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white',
              ].join(' ')}
            >
              <input
                type="radio"
                name="costing_method"
                value={opt.value}
                checked={form.costing_method === opt.value}
                onChange={() =>
                  setForm((p) => ({ ...p, costing_method: opt.value }))
                }
                className="mt-0.5 accent-orange-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <StepFooter loading={loading} onBack={onBack} />
    </form>
  );
}

// Step 4
interface Step4Props {
  onSave: (data: HRConfigPayload) => Promise<void>;
  loading: boolean;
  error: string | null;
  onBack: () => void;
}

function Step4HR({ onSave, loading, error, onBack }: Step4Props) {
  const [form, setForm] = useState<HRConfigPayload>({
    department_name: 'Ban Giám Đốc',
    payroll_day: 5,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Cấu hình nhân sự
        </h2>
        <p className="text-sm text-gray-500">
          Thiết lập bộ phận đầu tiên và chu kỳ tính lương
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Field
            label="Tên bộ phận đầu tiên"
            required
            helper="Bạn có thể thêm thêm bộ phận và nhân viên sau khi thiết lập xong"
          >
            <input
              type="text"
              value={form.department_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, department_name: e.target.value }))
              }
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Ngày trả lương hàng tháng" required>
          <select
            value={form.payroll_day}
            onChange={(e) =>
              setForm((p) => ({ ...p, payroll_day: Number(e.target.value) }))
            }
            className={selectCls}
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                Ngày {d} hàng tháng
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
        Bạn có thể thêm thêm bộ phận, chức vụ và nhân viên sau khi hoàn
        thành thiết lập ban đầu.
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <StepFooter loading={loading} onBack={onBack} />
    </form>
  );
}

// Step 5
const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Quản trị viên' },
  { value: 'CEO', label: 'Giám đốc' },
  { value: 'SALESMANAGER', label: 'Trưởng bán hàng' },
  { value: 'SALES', label: 'Nhân viên bán hàng' },
  { value: 'HRMANAGER', label: 'Trưởng HRM' },
  { value: 'ACCOUNT', label: 'Kế toán' },
  { value: 'PURCHASE', label: 'Mua hàng' },
  { value: 'WHSTAFF', label: 'Nhân viên kho' },
];

interface Step5Props {
  onComplete: (members: InviteMember[]) => Promise<void>;
  loading: boolean;
  error: string | null;
  onBack: () => void;
}

function Step5Invite({ onComplete, loading, error, onBack }: Step5Props) {
  const [members, setMembers] = useState<InviteMember[]>([
    { email: '', full_name: '', role: 'SALES' },
  ]);

  const addMember = () =>
    setMembers((prev) => [...prev, { email: '', full_name: '', role: 'SALES' }]);

  const removeMember = (idx: number) =>
    setMembers((prev) => prev.filter((_, i) => i !== idx));

  const updateMember = (
    idx: number,
    field: keyof InviteMember,
    value: string
  ) => {
    setMembers((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = members.filter((m) => m.email.trim() && m.full_name.trim());
    onComplete(filtered);
  };

  return (
    <form onSubmit={handleComplete} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Mời thành viên
        </h2>
        <p className="text-sm text-gray-500">
          Thêm đồng nghiệp vào hệ thống — hoặc bỏ qua và làm sau
        </p>
      </div>

      <div className="space-y-3">
        {members.map((member, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 items-start bg-gray-50 border border-gray-200 rounded-xl p-4"
          >
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Email
              </label>
              <input
                type="email"
                value={member.email}
                onChange={(e) => updateMember(idx, 'email', e.target.value)}
                placeholder="email@company.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Họ tên
              </label>
              <input
                type="text"
                value={member.full_name}
                onChange={(e) => updateMember(idx, 'full_name', e.target.value)}
                placeholder="Nguyễn Văn A"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Vai trò
              </label>
              <select
                value={member.role}
                onChange={(e) => updateMember(idx, 'role', e.target.value)}
                className={selectCls}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-5">
              {members.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMember(idx)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addMember}
        className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
      >
        <Plus className="w-4 h-4" />
        Thêm thành viên
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 inline-flex items-center justify-center gap-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 rounded-lg transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-2 inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang hoàn thành...
            </>
          ) : (
            <>
              Hoàn thành thiết lập
              <CheckCircle className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// Shared footer for steps 1-4
interface StepFooterProps {
  loading: boolean;
  isFirst?: boolean;
  onBack?: () => void;
}

function StepFooter({ loading, isFirst, onBack }: StepFooterProps) {
  return (
    <div className="flex gap-3 pt-2">
      {!isFirst && (
        <button
          type="button"
          onClick={onBack}
          className="flex-1 inline-flex items-center justify-center gap-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 rounded-lg transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại
        </button>
      )}
      <button
        type="submit"
        disabled={loading}
        className="flex-1 inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang lưu...
          </>
        ) : (
          <>
            Tiếp theo
            <ChevronRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const markDone = (step: number) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
    setCurrentStep(step + 1);
    setStepError(null);
  };

  const handleStep1 = async (data: CompanyInfoPayload, logo?: File) => {
    setLoading(true);
    setStepError(null);
    try {
      await setupApi.updateStep1(data);
      if (logo) {
        const fd = new FormData();
        fd.append('logo', logo);
        await setupApi.uploadLogo(fd);
      }
      markDone(1);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setStepError(
        axiosErr.response?.data?.message || 'Lưu thất bại. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (data: FinanceConfigPayload) => {
    setLoading(true);
    setStepError(null);
    try {
      await setupApi.updateStep2(data);
      markDone(2);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setStepError(
        axiosErr.response?.data?.message || 'Lưu thất bại. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async (data: WarehouseConfigPayload) => {
    setLoading(true);
    setStepError(null);
    try {
      await setupApi.updateStep3(data);
      markDone(3);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setStepError(
        axiosErr.response?.data?.message || 'Lưu thất bại. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStep4 = async (data: HRConfigPayload) => {
    setLoading(true);
    setStepError(null);
    try {
      await setupApi.updateStep4(data);
      markDone(4);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setStepError(
        axiosErr.response?.data?.message || 'Lưu thất bại. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStep5Complete = async (members: InviteMember[]) => {
    setLoading(true);
    setStepError(null);
    try {
      if (members.length > 0) {
        await setupApi.inviteMembers({ members });
      }
      await setupApi.complete();
      navigate('/');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setStepError(
        axiosErr.response?.data?.message ||
          'Hoàn thành thiết lập thất bại. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ─── Sidebar ─── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 px-6 py-8 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <img src="/assets/logo.png" alt="" className="h-8 w-8 object-contain" />
          <span className="text-lg font-bold">
            <span className="text-gray-900">ERP</span>
            <span className="text-orange-500"> Mini</span>
          </span>
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">
          Thiết lập ban đầu
        </p>

        <nav className="space-y-1 flex-1">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isDone = completedSteps.has(step.id);
            const isActive = currentStep === step.id;

            return (
              <div
                key={step.id}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-orange-50 text-orange-700 font-semibold'
                    : isDone
                    ? 'text-gray-600'
                    : 'text-gray-400',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                    isDone
                      ? 'bg-orange-500 text-white'
                      : isActive
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-gray-100 text-gray-400',
                  ].join(' ')}
                >
                  {isDone ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span>{step.label}</span>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Bước {currentStep} / {STEPS.length}
          </p>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep - 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <main className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/assets/logo.png" alt="" className="h-7 w-7 object-contain" />
            <span className="font-bold">
              <span className="text-gray-900">ERP</span>
              <span className="text-orange-500"> Mini</span>
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {currentStep}/{STEPS.length} —{' '}
            {STEPS[currentStep - 1]?.label}
          </span>
        </div>

        <div className="flex-1 overflow-auto px-4 sm:px-8 py-10">
          <div className="max-w-2xl mx-auto">
            {currentStep === 1 && (
              <Step1Company
                onSave={handleStep1}
                loading={loading}
                error={stepError}
              />
            )}
            {currentStep === 2 && (
              <Step2Finance
                onSave={handleStep2}
                loading={loading}
                error={stepError}
                onBack={() => { setCurrentStep(1); setStepError(null); }}
              />
            )}
            {currentStep === 3 && (
              <Step3Warehouse
                onSave={handleStep3}
                loading={loading}
                error={stepError}
                onBack={() => { setCurrentStep(2); setStepError(null); }}
              />
            )}
            {currentStep === 4 && (
              <Step4HR
                onSave={handleStep4}
                loading={loading}
                error={stepError}
                onBack={() => { setCurrentStep(3); setStepError(null); }}
              />
            )}
            {currentStep === 5 && (
              <Step5Invite
                onComplete={handleStep5Complete}
                loading={loading}
                error={stepError}
                onBack={() => { setCurrentStep(4); setStepError(null); }}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
