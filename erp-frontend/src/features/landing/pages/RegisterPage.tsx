import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Building2,
  Shield,
  Zap,
  HeadphonesIcon,
  Loader2,
} from 'lucide-react';
import { publicApi, RegisterPayload } from '../api/landing.api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Step1Data {
  company_name: string;
  tax_code: string;
  company_phone: string;
  company_email: string;
  address: string;
  industry: string;
  employee_count: string;
}

interface Step2Data {
  full_name: string;
  email: string;
  phone: string;
}

interface FormErrors {
  [key: string]: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const INDUSTRY_OPTIONS = [
  { value: '', label: 'Chọn ngành nghề' },
  { value: 'commerce', label: 'Thương mại' },
  { value: 'manufacturing', label: 'Sản xuất' },
  { value: 'service', label: 'Dịch vụ' },
  { value: 'construction', label: 'Xây dựng' },
  { value: 'retail', label: 'Bán lẻ' },
  { value: 'other', label: 'Khác' },
];

const EMPLOYEE_COUNT_OPTIONS = [
  { value: '', label: 'Chọn quy mô' },
  { value: '1-10', label: '1 – 10 nhân viên' },
  { value: '11-50', label: '11 – 50 nhân viên' },
  { value: '51-200', label: '51 – 200 nhân viên' },
  { value: '200+', label: '200+ nhân viên' },
];

const BENEFITS = [
  { icon: Zap, text: 'Thiết lập nhanh trong 5 phút' },
  { icon: Shield, text: 'Dữ liệu mã hóa, an toàn tuyệt đối' },
  { icon: HeadphonesIcon, text: 'Hỗ trợ 24/7 trong 30 ngày miễn phí' },
  { icon: Building2, text: 'Chuẩn VAS, sẵn sàng kiểm toán' },
  { icon: CheckCircle, text: 'Không cần thẻ tín dụng' },
];

// ─── Validators ───────────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateStep1(data: Step1Data): FormErrors {
  const errors: FormErrors = {};
  if (!data.company_name.trim()) {
    errors.company_name = 'Tên công ty là bắt buộc';
  }
  if (!data.tax_code.trim()) {
    errors.tax_code = 'Mã số thuế là bắt buộc';
  } else if (!/^\d{10}(\d{3})?$/.test(data.tax_code.trim())) {
    errors.tax_code = 'Mã số thuế phải có 10 hoặc 13 chữ số';
  }
  if (data.company_email.trim() && !EMAIL_REGEX.test(data.company_email.trim())) {
    errors.company_email = 'Email công ty không hợp lệ';
  }
  return errors;
}

function validateStep2(data: Step2Data): FormErrors {
  const errors: FormErrors = {};
  if (!data.full_name.trim()) {
    errors.full_name = 'Họ tên là bắt buộc';
  }
  if (!data.email.trim()) {
    errors.email = 'Email là bắt buộc';
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.email = 'Email không hợp lệ';
  }
  return errors;
}

// ─── Field components ─────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, required, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

const inputCls = (error?: string) =>
  [
    'w-full px-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-900 transition-all duration-300',
    'focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white',
    error
      ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400'
      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-650',
  ].join(' ');

// ─── Main component ───────────────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillEmail = searchParams.get('email') ?? '';

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [step1, setStep1] = useState<Step1Data>({
    company_name: '',
    tax_code: '',
    company_phone: '',
    company_email: '',
    address: '',
    industry: '',
    employee_count: '',
  });

  const [step2, setStep2] = useState<Step2Data>({
    full_name: '',
    email: prefillEmail,
    phone: '',
  });

  const updateStep1 = (field: keyof Step1Data) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setStep1((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const updateStep2 = (field: keyof Step2Data) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setStep2((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleNextStep = () => {
    const errs = validateStep1(step1);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateStep2(step2);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setServerError(null);

    const payload: RegisterPayload = {
      company_name: step1.company_name.trim(),
      tax_code: step1.tax_code.trim(),
      company_phone: step1.company_phone || undefined,
      company_email: step1.company_email || undefined,
      address: step1.address || undefined,
      industry: step1.industry || undefined,
      employee_count: step1.employee_count || undefined,
      full_name: step2.full_name.trim(),
      email: step2.email.trim(),
      phone: step2.phone || undefined,
    };

    try {
      await publicApi.register(payload);
      setSuccess(true);
    } catch (err) {
      const axiosErr = err as AxiosError<unknown>;
      const responseData = axiosErr.response?.data as any;
      const serverMessage =
        responseData?.message ||
        responseData?.error ||
        (Array.isArray(responseData?.errors)
          ? responseData.errors.map((item: any) => item.message || item).join('; ')
          : undefined) ||
        axiosErr.message ||
        'Đăng ký thất bại. Vui lòng thử lại.';
      setServerError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] p-2 rounded-[2.5rem] shadow-sm max-w-md w-full">
          <div className="bg-white dark:bg-slate-900 rounded-[calc(2.5rem-0.5rem)] p-10 border border-slate-200/40 dark:border-slate-800/40 shadow-2xl text-center">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/20">
              <CheckCircle className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-805 dark:text-white mb-3">
              Đăng ký thành công!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              Chúng tôi đã gửi email kích hoạt đến{' '}
              <span className="font-semibold text-slate-800 dark:text-white">{step2.email}</span>.
              Vui lòng kiểm tra hộp thư để kích hoạt tài khoản.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs uppercase tracking-wider py-3 rounded-full transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] shadow-md shadow-orange-500/10"
            >
              Đến trang đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col pt-28">
      
      {/* ─── Floating Glass Header ─── */}
      <div className="fixed top-6 left-6 right-6 max-w-6xl mx-auto bg-white/75 dark:bg-slate-900/75 backdrop-blur-lg border border-slate-200/50 dark:border-slate-800/50 rounded-full z-50 shadow-[0_8px_30px_rgba(0,0,0,0.03)] px-8 py-3.5 flex justify-between items-center h-14 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
        <Link to="/" className="flex items-center gap-2 select-none hover:opacity-90 transition-opacity">
          <img src="/assets/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
          <span className="text-lg font-bold tracking-tight">
            <span className="text-slate-900 dark:text-white">ERP</span>
            <span className="text-orange-500"> Mini</span>
          </span>
        </Link>
        <span className="text-xs text-slate-500 font-medium">
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            className="text-orange-500 hover:text-orange-600 font-semibold uppercase tracking-wider text-[11px] ml-1.5"
          >
            Đăng nhập
          </Link>
        </span>
      </div>

      <div className="max-w-5xl w-full mx-auto px-6 py-10 flex-1 flex flex-col justify-center">
        
        {/* Pill-shaped step progress indicator */}
        <div className="bg-slate-100 dark:bg-slate-800/60 p-1 rounded-full flex gap-1 max-w-[320px] mx-auto mb-12">
          {[
            { num: 1, label: 'Công ty' },
            { num: 2, label: 'Admin' },
          ].map(({ num, label }) => (
            <button
              key={num}
              disabled
              className={[
                'flex-1 py-1.5 px-4 rounded-full text-xs font-bold transition-all duration-500 flex items-center justify-center gap-2',
                step === num
                  ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm'
                  : 'text-slate-400 dark:text-slate-500',
              ].join(' ')}
            >
              <span className={step === num ? 'text-orange-500' : 'text-slate-400'}>0{num}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          
          {/* Form column (Double Bezel Card) */}
          <div className="lg:col-span-3 bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] p-2 rounded-[2.5rem] shadow-sm">
            <div className="bg-white dark:bg-slate-900 rounded-[calc(2.5rem-0.5rem)] p-8 border border-slate-200/40 dark:border-slate-800/40 shadow-sm">
              {step === 1 ? (
                <>
                  <div className="text-left mb-6 space-y-1">
                    <h2 className="text-2xl font-bold text-slate-805 dark:text-white">
                      Thông tin công ty
                    </h2>
                    <p className="text-xs text-slate-400">
                      Điền thông tin doanh nghiệp của bạn để bắt đầu
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <Field
                        label="Tên công ty"
                        required
                        error={errors.company_name}
                      >
                        <input
                          type="text"
                          value={step1.company_name}
                          onChange={updateStep1('company_name')}
                          placeholder="VD: Công ty TNHH ABC"
                          className={inputCls(errors.company_name)}
                        />
                      </Field>
                    </div>

                    <Field
                      label="Mã số thuế"
                      required
                      error={errors.tax_code}
                    >
                      <input
                        type="text"
                        value={step1.tax_code}
                        onChange={updateStep1('tax_code')}
                        placeholder="10 hoặc 13 chữ số"
                        maxLength={13}
                        className={inputCls(errors.tax_code)}
                      />
                    </Field>

                    <Field label="Số điện thoại công ty">
                      <input
                        type="tel"
                        value={step1.company_phone}
                        onChange={updateStep1('company_phone')}
                        placeholder="0xxx xxx xxx"
                        className={inputCls()}
                      />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field label="Email công ty" error={errors.company_email}>
                        <input
                          type="email"
                          value={step1.company_email}
                          onChange={updateStep1('company_email')}
                          placeholder="contact@company.com"
                          className={inputCls(errors.company_email)}
                        />
                      </Field>
                    </div>

                    <div className="sm:col-span-2">
                      <Field label="Địa chỉ">
                        <input
                          type="text"
                          value={step1.address}
                          onChange={updateStep1('address')}
                          placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP"
                          className={inputCls()}
                        />
                      </Field>
                    </div>

                    <Field label="Ngành nghề">
                      <select
                        value={step1.industry}
                        onChange={updateStep1('industry')}
                        className={inputCls()}
                      >
                        {INDUSTRY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Quy mô nhân sự">
                      <select
                        value={step1.employee_count}
                        onChange={updateStep1('employee_count')}
                        className={inputCls()}
                      >
                        {EMPLOYEE_COUNT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <button
                    onClick={handleNextStep}
                    className="mt-8 w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs uppercase tracking-wider py-3 rounded-full transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] shadow-md shadow-orange-500/10"
                  >
                    Tiếp theo
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="text-left mb-6 space-y-1">
                    <h2 className="text-2xl font-bold text-slate-805 dark:text-white">
                      Tài khoản quản trị viên
                    </h2>
                    <p className="text-xs text-slate-400">
                      Tạo tài khoản admin đầu tiên cho hệ thống
                    </p>
                  </div>

                  <div className="flex flex-col gap-5">
                    <Field
                      label="Họ tên người đại diện"
                      required
                      error={errors.full_name}
                    >
                      <input
                        type="text"
                        value={step2.full_name}
                        onChange={updateStep2('full_name')}
                        placeholder="Nguyễn Văn A"
                        className={inputCls(errors.full_name)}
                      />
                    </Field>

                    <Field
                      label="Email đăng nhập"
                      required
                      error={errors.email}
                    >
                      <input
                        type="email"
                        value={step2.email}
                        onChange={updateStep2('email')}
                        placeholder="admin@company.com"
                        className={inputCls(errors.email)}
                      />
                    </Field>

                    <Field label="Số điện thoại">
                      <input
                        type="tel"
                        value={step2.phone}
                        onChange={updateStep2('phone')}
                        placeholder="0xxx xxx xxx"
                        className={inputCls()}
                      />
                    </Field>

                    {serverError && (
                      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-650 dark:text-red-400 text-xs px-4 py-3.5 rounded-xl">
                        {serverError}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setErrors({});
                          setServerError(null);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-850 hover:border-slate-300 text-slate-600 dark:text-slate-350 font-semibold text-xs uppercase tracking-wider py-3 rounded-full transition-all duration-300 active:scale-[0.98]"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs uppercase tracking-wider py-3 rounded-full transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] shadow-md shadow-orange-500/10"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            Hoàn thành
                            <CheckCircle className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Info column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Why choose ERP Mini */}
            <div className="bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] p-2 rounded-[2.5rem] shadow-sm">
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-[calc(2.5rem-0.5rem)] p-8 text-white text-left space-y-6 border border-orange-500/10 shadow-lg">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">Tại sao chọn ERP Mini?</h3>
                  <p className="text-orange-100 text-xs">
                    Hàng trăm doanh nghiệp Việt Nam đã tin tưởng
                  </p>
                </div>
                <ul className="space-y-4">
                  {BENEFITS.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs text-orange-50 font-medium">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* In the trial plan */}
            <div className="bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] p-2 rounded-[2.5rem] shadow-sm">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 rounded-[calc(2.5rem-0.5rem)] p-8 text-left space-y-4 shadow-sm">
                <h4 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider">
                  Bao gồm trong gói dùng thử
                </h4>
                <ul className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
                  {[
                    'Đầy đủ tính năng Professional',
                    'Không giới hạn dữ liệu thử',
                    'Hướng dẫn onboarding 1-1',
                    'Import dữ liệu từ Excel',
                    'Hỗ trợ qua chat & email',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
