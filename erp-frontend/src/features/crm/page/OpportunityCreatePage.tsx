import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, BadgeCheck, Briefcase, Building2, CalendarDays, DollarSign, GitBranch, Hash, Mail, MapPin, Phone, Target, UserRound } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/Button";

import { FormInput } from "@/components/ui/FormInput";
import { NumberField } from "@/components/ui/NumberField";
import { UiAlert } from "@/types/ui";
import { formatStageProbability } from "../helpers/pipeline.helpers";
import { fetchAllLeads } from "../store/lead/lead.thunks";
import { createOpportunity } from "../store/opportunity/opportunity.thunks";
import { fetchPartners } from "../../partner/partner.service";
import { Partner } from "../../partner/store/partner.types";
import { Lead } from "../dto/lead.dto";
import { CreateOpportunityDto } from "../dto/opportunity.dto";
import { Pipeline, PipelineStage } from "../dto/pipeline.dto";
import * as pipelineApi from "../api/pipeline.api";
import { Currency } from "../../master-data/dto/currency.dto";
import * as currencyService from "../../master-data/service/currency.service";

const BASE_CURRENCY_CODE = "VND";

const inputClass =
  "w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500";

function toDateInputValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function getTomorrowDateInput() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toDateInputValue(tomorrow);
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-600">
        {icon}
      </span>
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-gray-700">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

function formatDisplayValue(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "--";
  return String(value);
}

function formatMoney(value?: number | null) {
  if (value === undefined || value === null) return "--";
  return value.toLocaleString("vi-VN");
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="truncate text-sm font-medium text-gray-800">{formatDisplayValue(value)}</p>
      </div>
    </div>
  );
}

export default function OpportunityCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { allLeads } = useAppSelector((s) => s.lead);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currencyId, setCurrencyId] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(1);


  const initialRelatedType = searchParams.get("related_type") === "customer" ? "customer" : "lead";
  const initialRelatedId = searchParams.get("related_id") || "";

  const [mode, setMode] = useState<"lead" | "customer">(initialRelatedType);
  const [form, setForm] = useState({
    related_id: initialRelatedId,
    name: "",
    expected_value: "",
    probability: "",
    closing_date: "",
    next_action: "",
    next_action_date: "",
  });
  const [pipelineId, setPipelineId] = useState<number | null>(null);
  const [stageId, setStageId] = useState<number | null>(null);

  const todayInput = toDateInputValue(new Date());
  const minFutureDate = getTomorrowDateInput();

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    dispatch(fetchAllLeads());
    loadCustomers();
    loadCurrencies();
    pipelineApi
      .getAllPipelines()
      .then((res) => {
        const list: Pipeline[] = res.data.data || [];
        setPipelines(list);
        if (list.length > 0) {
          const defaultPipeline = list.find((p) => p.is_default) || list[0];
          setPipelineId(defaultPipeline.id);
          const firstStage = [...(defaultPipeline.stages || [])].sort((a, b) => a.sequence - b.sequence)[0];
          if (firstStage) setStageId(firstStage.id);
        }
      })
      .catch(() => {});
  }, [dispatch]);

  const loadCustomers = async () => {
    try {
      const customers = await fetchPartners({ type: "customer" });
      setPartners(customers);
    } catch {
      /* ignore */
    }
  };

  const loadCurrencies = async () => {
    try {
      const data = await currencyService.getCurrencies();
      setCurrencies(data || []);
    } catch {
      /* ignore */
    }
  };

  const fetchExchangeRate = async (selectedCurrencyId: number | null) => {
    if (!selectedCurrencyId) {
      setExchangeRate(1);
      return;
    }

    const selected = currencies.find((currency) => currency.id === selectedCurrencyId);
    if (!selected || selected.code === BASE_CURRENCY_CODE) {
      setExchangeRate(1);
      return;
    }

    try {
      const data = await currencyService.getExchangeRates();
      const rates: Array<{ quoteCurrency: { code: string }; rate: number }> = data?.rates || [];
      const match = rates.find((rate) => rate.quoteCurrency.code === selected.code);

      if (match?.rate) {
        setExchangeRate(Math.round(1 / Number(match.rate)));
        return;
      }

      setExchangeRate(0);
    } catch {
      setExchangeRate(0);
    }
  };

  const selectedPipeline = pipelines.find((p) => p.id === pipelineId);
  const stages: PipelineStage[] = [...(selectedPipeline?.stages || [])].sort((a, b) => a.sequence - b.sequence);
  const availableLeads = useMemo(() => allLeads.filter((lead: Lead) => lead.stage === "new"), [allLeads]);
  const selectedCurrency = currencies.find((currency) => currency.id === currencyId);
  const isForeignCurrency = Boolean(selectedCurrency && selectedCurrency.code !== BASE_CURRENCY_CODE);
  const foreignCurrencies = currencies.filter((currency) => currency.code !== BASE_CURRENCY_CODE);
  const selectedLead = mode === "lead" ? availableLeads.find((lead: Lead) => lead.id === Number(form.related_id)) : null;
  const selectedCustomer = mode === "customer" ? partners.find((partner) => partner.id === Number(form.related_id)) : null;

  const handlePipelineChange = (newPipelineId: number) => {
    setPipelineId(newPipelineId);
    const pipeline = pipelines.find((item) => item.id === newPipelineId);
    const firstStage = [...(pipeline?.stages || [])].sort((a, b) => a.sequence - b.sequence)[0];
    setStageId(firstStage?.id || null);
  };

  const handleCurrencyChange = (value: string) => {
    const nextCurrencyId = value ? Number(value) : null;
    setCurrencyId(nextCurrencyId);
    fetchExchangeRate(nextCurrencyId);
  };

  const handleCreate = async () => {
    if (!form.name || !form.related_id) {
      toast.warning("Hãy chọn khách hàng tiềm năng/khách hàng và nhập tên cơ hội.");
      return;
    }

    if (form.closing_date && form.closing_date <= todayInput) {
      toast.warning("Ngày chốt dự kiến phải lớn hơn ngày hôm nay.");
      return;
    }

    if (form.next_action_date && form.next_action_date <= todayInput) {
      toast.warning("Ngày hành động tiếp theo phải lớn hơn ngày hôm nay.");
      return;
    }

    if (isForeignCurrency && exchangeRate <= 0) {
      toast.warning("Chưa có tỷ giá mới nhất cho tiền tệ đã chọn.");
      return;
    }

    const payload: CreateOpportunityDto = {
      related_type: mode,
      related_id: Number(form.related_id),
      name: form.name,
      expected_value: form.expected_value ? Number(form.expected_value) : undefined,
      probability: form.probability ? Number(form.probability) : undefined,
      closing_date: form.closing_date || null,
      pipeline_id: pipelineId,
      pipeline_stage_id: stageId,
      next_action: form.next_action || null,
      next_action_date: form.next_action_date || null,
      currency_id: currencyId,
      exchange_rate: isForeignCurrency ? exchangeRate : 1,
    };

    try {
      const result = await dispatch(createOpportunity(payload)).unwrap();
      toast.success("Tạo cơ hội kinh doanh thành công!");
      setTimeout(() => {
        navigate(`/crm/opportunities/${result.id}`);
      }, 700);
    } catch (error: any) {
      // error giờ là string message từ thunk (rejectWithValue) — hiển thị lý do thật
      toast.error(typeof error === "string" ? error : "Không thể tạo cơ hội kinh doanh");
    }
  };

  return (
    <div className="page-container">
      <div className="erp-card mx-auto max-w-5xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Quay lại"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
              <Target className="h-4 w-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Tạo cơ hội kinh doanh mới</h1>
              <p className="text-xs text-gray-500">Khởi tạo cơ hội bán hàng với pipeline, giá trị và lịch chăm sóc.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5">


          <section className="space-y-4">
            <SectionTitle
              icon={<UserRound className="h-4 w-4" />}
              title="Đối tượng liên quan"
              description="Chọn khách hàng tiềm năng còn mới hoặc khách hàng đã chuyển đổi."
            />

            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div>
                <FieldLabel>Tạo từ</FieldLabel>
                <div className="grid grid-cols-2 rounded-md bg-gray-100 p-1">
                  <button
                    type="button"
                    className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                      mode === "lead" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => {
                      setMode("lead");
                      updateField("related_id", "");
                    }}
                  >
                    Khách hàng tiềm năng
                  </button>
                  <button
                    type="button"
                    className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                      mode === "customer" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => {
                      setMode("customer");
                      updateField("related_id", "");
                    }}
                  >
                    Khách hàng
                  </button>
                </div>
              </div>

              <div>
                <FieldLabel required>{mode === "lead" ? "Chọn khách hàng tiềm năng" : "Chọn khách hàng"}</FieldLabel>
                <select className={inputClass} value={form.related_id} onChange={(e) => updateField("related_id", e.target.value)}>
                  <option value="">-- {mode === "lead" ? "Chọn khách hàng tiềm năng" : "Chọn khách hàng"} --</option>
                  {mode === "lead"
                    ? availableLeads.map((lead: Lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.name} - {lead.email ?? "chưa có email"}
                        </option>
                      ))
                    : partners.map((partner) => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name} - {partner.phone ?? "no phone"}
                        </option>
                      ))}
                </select>
              </div>
            </div>

            {form.related_id ? (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                {selectedLead && (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase text-gray-500">Khách hàng tiềm năng đang chọn</p>
                        <h3 className="truncate text-base font-semibold text-gray-900">{selectedLead.name}</h3>
                      </div>
                      <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
                        {selectedLead.stage}
                      </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={selectedLead.email} />
                      <InfoItem icon={<Phone className="h-4 w-4" />} label="Số điện thoại" value={selectedLead.phone} />
                      <InfoItem icon={<Building2 className="h-4 w-4" />} label="Công ty" value={selectedLead.company_name} />
                      <InfoItem icon={<Briefcase className="h-4 w-4" />} label="Chức vụ" value={selectedLead.job_title} />
                      <InfoItem
                        icon={<BadgeCheck className="h-4 w-4" />}
                        label="Điểm/grade"
                        value={`${selectedLead.lead_score ?? "--"} / ${selectedLead.score_grade ?? "--"}`}
                      />
                      <InfoItem icon={<DollarSign className="h-4 w-4" />} label="Doanh thu năm" value={formatMoney(selectedLead.annual_revenue)} />
                    </div>
                  </div>
                )}

                {selectedCustomer && (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase text-gray-500">Khách hàng đang chọn</p>
                        <h3 className="truncate text-base font-semibold text-gray-900">{selectedCustomer.name}</h3>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {selectedCustomer.status}
                      </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <InfoItem icon={<UserRound className="h-4 w-4" />} label="Người liên hệ" value={selectedCustomer.contact_person} />
                      <InfoItem icon={<Phone className="h-4 w-4" />} label="Số điện thoại" value={selectedCustomer.phone} />
                      <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={selectedCustomer.email} />
                      <InfoItem icon={<Hash className="h-4 w-4" />} label="Mã số thuế/CCCD" value={selectedCustomer.tax_code || selectedCustomer.cccd} />
                      <InfoItem icon={<MapPin className="h-4 w-4" />} label="Địa chỉ" value={selectedCustomer.address} />
                      <InfoItem
                        icon={<Building2 className="h-4 w-4" />}
                        label="Khu vực"
                        value={[selectedCustomer.ward, selectedCustomer.district, selectedCustomer.province].filter(Boolean).join(", ")}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                Chọn {mode === "lead" ? "khách hàng tiềm năng" : "khách hàng"} để xem nhanh thông tin liên quan trước khi tạo cơ hội.
              </div>
            )}
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-5">
            <SectionTitle
              icon={<GitBranch className="h-4 w-4" />}
              title="Quy trình bán hàng"
              description="Chọn quy trình và giai đoạn bắt đầu cho cơ hội kinh doanh."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Quy trình bán hàng</FieldLabel>
                <select className={inputClass} value={pipelineId || ""} onChange={(e) => handlePipelineChange(Number(e.target.value))}>
                  {pipelines.map((pipeline) => (
                    <option key={pipeline.id} value={pipeline.id}>
                      {pipeline.name} {pipeline.is_default ? "(Mặc định)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Giai đoạn khởi đầu</FieldLabel>
                <select className={inputClass} value={stageId || ""} onChange={(e) => setStageId(Number(e.target.value))}>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name} (thứ tự: {stage.sequence}{formatStageProbability(stage.probability) ? `, xác suất: ${formatStageProbability(stage.probability)}` : ""})
                      {stage.is_won ? " - THẮNG" : ""}
                      {stage.is_lost ? " - THUA" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-5">
            <SectionTitle
              icon={<DollarSign className="h-4 w-4" />}
              title="Giá trị và tiền tệ"
              description="Tỷ giá được lấy tự động theo bảng tỷ giá mới nhất."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Tên cơ hội kinh doanh"
                value={form.name}
                onChange={(value) => updateField("name", value)}
                required
                placeholder="VD: Triển khai ERP cho công ty ABC"
              />
              <div>
                <FieldLabel>Giá trị kỳ vọng</FieldLabel>
                <NumberField
                  value={form.expected_value === "" ? null : Number(form.expected_value)}
                  onChange={(v) => updateField("expected_value", v == null ? "" : String(v))}
                  placeholder="50.000.000"
                />
              </div>
              <div>
                <FieldLabel>Xác suất (%)</FieldLabel>
                <NumberField
                  variant="percent"
                  value={form.probability === "" ? null : Number(form.probability)}
                  onChange={(v) => updateField("probability", v == null ? "" : String(v))}
                  placeholder="50"
                />
              </div>
              <div>
                <FieldLabel>Tiền tệ</FieldLabel>
                <select className={inputClass} value={currencyId || ""} onChange={(e) => handleCurrencyChange(e.target.value)}>
                  <option value="">{BASE_CURRENCY_CODE} - Tiền tệ cơ sở</option>
                  {foreignCurrencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.code} - {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {isForeignCurrency && (
                <div className="md:col-span-2">
                  <FieldLabel>Tỷ giá mới nhất</FieldLabel>
                  <div className="flex min-h-9 items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                    <span className="font-medium text-gray-800">
                      {exchangeRate > 0
                        ? `1 ${selectedCurrency?.code} = ${Math.round(exchangeRate).toLocaleString("vi-VN")} ${BASE_CURRENCY_CODE}`
                        : "Chưa có tỷ giá cho tiền tệ này"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-5">
            <SectionTitle
              icon={<CalendarDays className="h-4 w-4" />}
              title="Kế hoạch chăm sóc"
              description="Các ngày kế hoạch phải lớn hơn ngày hôm nay."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Ngày chốt dự kiến</FieldLabel>
                <input
                  type="date"
                  min={minFutureDate}
                  className={inputClass}
                  value={form.closing_date}
                  onChange={(e) => updateField("closing_date", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Ngày hành động tiếp</FieldLabel>
                <input
                  type="date"
                  min={minFutureDate}
                  className={inputClass}
                  value={form.next_action_date}
                  onChange={(e) => updateField("next_action_date", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <FormInput
                  label="Hành động tiếp theo"
                  value={form.next_action}
                  onChange={(value) => updateField("next_action", value)}
                  placeholder="VD: Gọi lại, gửi báo giá..."
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Tạo cơ hội kinh doanh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
