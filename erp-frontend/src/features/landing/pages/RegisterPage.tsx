import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import {
  BarChart3,
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
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
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
    'w-full px-3 py-2.5 text-sm rounded-lg border bg-white transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent',
    error
      ? 'border-red-400 focus:ring-red-400'
      : 'border-gray-300 hover:border-gray-400',
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

  // ─── Success screen ───────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Đăng ký thành công!
          </h2>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Chúng tôi đã gửi email kích hoạt đến{' '}
            <span className="font-medium text-gray-700">{step2.email}</span>.
            Vui lòng kiểm tra hộp thư (kể cả thư mục spam) để kích hoạt tài
            khoản.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Đến trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/assets/logo.png" alt="" className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold">
              <span className="text-gray-900">ERP</span>
              <span className="text-orange-500"> Mini</span>
            </span>
          </Link>
          <span className="text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Đăng nhập
            </Link>
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {[
            { num: 1, label: 'Thông tin công ty' },
            { num: 2, label: 'Tài khoản admin' },
          ].map(({ num, label }, idx) => (
            <div key={num} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                    step > num
                      ? 'bg-orange-500 text-white'
                      : step === num
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-200 text-gray-500',
                  ].join(' ')}
                >
                  {step > num ? <CheckCircle className="w-4 h-4" /> : num}
                </div>
                <span
                  className={[
                    'text-sm font-medium hidden sm:block',
                    step >= num ? 'text-gray-800' : 'text-gray-400',
                  ].join(' ')}
                >
                  {label}
                </span>
              </div>
              {idx === 0 && (
                <div
                  className={[
                    'w-16 h-0.5 transition-colors',
                    step >= 2 ? 'bg-orange-400' : 'bg-gray-200',
                  ].join(' ')}
                />
              )}
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* ── Form column ── */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {step === 1 ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Thông tin công ty
                </h2>
                <p className="text-sm text-gray-500 mb-7">
                  Điền thông tin doanh nghiệp của bạn để bắt đầu
                </p>

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
                  className="mt-7 w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Tiếp theo
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Tài khoản quản trị viên
                </h2>
                <p className="text-sm text-gray-500 mb-7">
                  Tạo tài khoản admin đầu tiên cho hệ thống
                </p>

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
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
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
                      className="flex-1 inline-flex items-center justify-center gap-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Quay lại
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang xử lý...
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

          {/* ── Info column ── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-orange-500 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-1">
                Tại sao chọn ERP Mini?
              </h3>
              <p className="text-orange-100 text-sm mb-5">
                Hàng trăm doanh nghiệp Việt Nam đã tin tưởng
              </p>
              <ul className="space-y-3">
                {BENEFITS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm text-orange-50">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-3">
                Bao gồm trong gói dùng thử
              </h4>
              <ul className="space-y-2.5 text-sm text-gray-600">
                {[
                  'Đầy đủ tính năng Professional',
                  'Không giới hạn dữ liệu thử',
                  'Hướng dẫn onboarding 1-1',
                  'Import dữ liệu từ Excel',
                  'Hỗ trợ qua chat & email',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
