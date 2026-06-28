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
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col pt-24 pb-12">
      
      {/* ─── Floating Glass Header ─── */}
      <div className="fixed top-6 left-6 right-6 max-w-6xl mx-auto bg-white/75 dark:bg-slate-900/75 backdrop-blur-lg border border-slate-200/50 dark:border-slate-800/50 rounded-full z-50 shadow-[0_8px_30px_rgba(0,0,0,0.03)] px-8 py-3 flex justify-between items-center h-16 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
        <Link to="/" className="flex items-center gap-2.5 select-none hover:opacity-90 transition-opacity">
          <img src="/assets/logo.png" alt="Logo" className="h-9 w-9 object-contain" />
          <span className="text-xl font-bold tracking-tight">
            <span className="text-slate-900 dark:text-white">ERP</span>
            <span className="text-orange-500"> Mini</span>
          </span>
        </Link>
        <span className="text-sm text-slate-500 font-medium">
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            className="text-orange-500 hover:text-orange-600 font-semibold uppercase tracking-wider text-xs ml-1.5"
          >
            Đăng nhập
          </Link>
        </span>
      </div>

      <div className="max-w-5xl w-full mx-auto px-6 py-6 flex-1 flex flex-col justify-center">
        {/* Unified Dual-Pane Card */}
        <div className="bg-slate-900/[0.02] dark:bg-white/[0.01] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06] p-2 rounded-[2.5rem] shadow-sm w-full">
          <div className="bg-white dark:bg-slate-900 rounded-[calc(2.5rem-0.5rem)] border border-slate-200/40 dark:border-slate-800/40 shadow-2xl overflow-hidden grid lg:grid-cols-12">
            
            {/* Left Pane: Form (7 Columns) */}
            <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
              <div>
                {/* Clean, Semantic Title Header with highest priority */}
                <div className="text-left mb-8 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {step === 1 ? 'Thông tin doanh nghiệp' : 'Tài khoản quản trị'}
                    </h2>
                    {/* Modern pill step progress indicator */}
                    <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-500/10 border border-orange-200/50 dark:border-orange-500/20 px-3 py-1 rounded-full flex-shrink-0">
                      <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">
                        Bước {step}/2
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5">
                    {step === 1 
                      ? 'Nhập các thông tin cơ bản để chúng tôi khởi tạo không gian làm việc riêng cho bạn.'
                      : 'Tài khoản này dùng để đăng nhập và thiết lập cấu hình hệ thống ban đầu.'}
                  </p>
                </div>

                {step === 1 ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
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
                            placeholder="Ví dụ: Công ty TNHH Giải pháp Công nghệ Việt"
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
                          placeholder="024 xxx xxxx"
                          className={inputCls()}
                        />
                      </Field>

                      <div className="sm:col-span-2">
                        <Field label="Email công ty" error={errors.company_email}>
                          <input
                            type="email"
                            value={step1.company_email}
                            onChange={updateStep1('company_email')}
                            placeholder="lienhe@congty.com"
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
                            placeholder="Số nhà, tên đường, quận/huyện, tỉnh/thành phố"
                            className={inputCls()}
                          />
                        </Field>
                      </div>

                      <Field label="Ngành nghề kinh doanh">
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
                      Tiếp tục bước tiếp theo
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-4">
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
                        label="Email đăng nhập quản trị"
                        required
                        error={errors.email}
                      >
                        <input
                          type="email"
                          value={step2.email}
                          onChange={updateStep2('email')}
                          placeholder="admin@congty.com"
                          className={inputCls(errors.email)}
                        />
                      </Field>

                      <Field label="Số điện thoại cá nhân">
                        <input
                          type="tel"
                          value={step2.phone}
                          onChange={updateStep2('phone')}
                          placeholder="09xx xxx xxx"
                          className={inputCls()}
                        />
                      </Field>

                      {serverError && (
                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-650 dark:text-red-400 text-xs px-4 py-3.5 rounded-xl">
                          {serverError}
                        </div>
                      )}

                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setStep(1);
                            setErrors({});
                            setServerError(null);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800 hover:border-slate-350 text-slate-600 dark:text-slate-300 font-semibold text-xs uppercase tracking-wider py-3 rounded-full transition-all duration-300 active:scale-[0.98]"
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
                              Đang đăng ký...
                            </>
                          ) : (
                            <>
                              Hoàn thành đăng ký
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

            {/* Right Pane: Marketing Info (5 Columns) - Cam Trắng (Orange/White) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-orange-500 to-orange-600 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-l border-orange-500/10">
              {/* Background ambient lighting effects */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-[85px] pointer-events-none" />

              <div className="relative z-10 space-y-8 flex-1 flex flex-col justify-center">
                <div className="space-y-2 text-left">
                  <h3 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                    Trải nghiệm ERP toàn diện
                  </h3>
                  <p className="text-orange-100 text-xs leading-relaxed">
                    Hệ thống quản trị hợp nhất dành riêng cho doanh nghiệp SME và Startups tại Việt Nam.
                  </p>
                </div>

                {/* Key Benefits List with Orange/White Branding */}
                <div className="space-y-5">
                  {BENEFITS.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-start gap-3 text-left">
                      <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-xs font-semibold text-white leading-normal">{text}</p>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-white/20 my-2" />

                {/* Trial features details */}
                <div className="text-left space-y-3">
                  <span className="text-[10px] font-bold text-orange-100 uppercase tracking-widest block">
                    Gói dùng thử chuyên nghiệp bao gồm:
                  </span>
                  <ul className="space-y-2">
                    {[
                      'Đầy đủ tính năng phân hệ Professional',
                      'Không giới hạn dung lượng và số lượng chứng từ',
                      'Onboarding và hướng dẫn cài đặt 1-1 miễn phí',
                      'Tự động import nhanh dữ liệu từ file Excel',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-orange-50">
                        <CheckCircle className="w-3.5 h-3.5 text-white mt-0.5 flex-shrink-0" />
                        <span className="leading-tight">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
