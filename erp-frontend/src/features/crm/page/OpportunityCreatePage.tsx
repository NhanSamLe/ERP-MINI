import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
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
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { UiAlert } from "@/types/ui";
import { Target, ArrowLeft } from "lucide-react";
import { FormInput } from "@/components/ui/FormInput";

export default function OpportunityCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { allLeads } = useAppSelector((s) => s.lead);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currencyId, setCurrencyId] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [alert, setAlert] = useState<UiAlert | null>(null);

  const [mode, setMode] = useState<"lead" | "customer">("lead");
  const [form, setForm] = useState({
    related_id: "",
    name: "",
    expected_value: "",
    probability: "",
    closing_date: "",
    next_action: "",
    next_action_date: "",
  });
  const [pipelineId, setPipelineId] = useState<number | null>(null);
  const [stageId, setStageId] = useState<number | null>(null);

  const updateField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  useEffect(() => {
    dispatch(fetchAllLeads());
    loadCustomers();
    loadCurrencies();
    pipelineApi.getAllPipelines().then((res) => {
      const list: Pipeline[] = res.data.data || [];
      setPipelines(list);
      if (list.length > 0) {
        const defaultP = list.find((p) => p.is_default) || list[0];
        setPipelineId(defaultP.id);
        const firstStage = defaultP.stages?.sort((a, b) => a.sequence - b.sequence)[0];
        if (firstStage) setStageId(firstStage.id);
      }
    }).catch(() => {});
  }, [dispatch]);

  const loadCustomers = async () => {
    try {
      const customers = await fetchPartners({ type: "customer" });
      setPartners(customers);
    } catch { /* ignore */ }
  };

  const loadCurrencies = async () => {
    try {
      const data = await currencyService.getCurrencies();
      setCurrencies(data || []);
    } catch { /* ignore */ }
  };

  const fetchExchangeRate = async (cid: number | null) => {
    if (!cid) { setExchangeRate(1); return; }
    try {
      const data = await currencyService.getExchangeRates();
      const rates: Array<{ quoteCurrency: { code: string }; rate: number }> = data?.rates || [];
      const selected = currencies.find((c) => c.id === cid);
      if (!selected) { setExchangeRate(1); return; }
      
      // If selected currency is VND, rate is 1
      if (selected.code === "VND") {
        setExchangeRate(1);
        return;
      }
      
      // Find the rate where quoteCurrency is the selected currency
      const match = rates.find((r) => r.quoteCurrency.code === selected.code);
      if (match && match.rate) {
        // The rate in DB is VND → Foreign (e.g., VND → EUR = 0.000037)
        // We need Foreign → VND, so invert it (e.g., EUR → VND = 1/0.000037 = 27000)
        const invertedRate = 1 / Number(match.rate);
        setExchangeRate(Math.round(invertedRate));
      } else {
        setExchangeRate(1);
      }
    } catch (err) { 
      setExchangeRate(1); 
    }
  };

  const selectedPipeline = pipelines.find((p) => p.id === pipelineId);
  const stages: PipelineStage[] = selectedPipeline?.stages?.sort((a, b) => a.sequence - b.sequence) || [];

  // When pipeline changes, auto-select first stage
  const handlePipelineChange = (newPipelineId: number) => {
    setPipelineId(newPipelineId);
    const p = pipelines.find((pp) => pp.id === newPipelineId);
    const firstStage = p?.stages?.sort((a, b) => a.sequence - b.sequence)[0];
    setStageId(firstStage?.id || null);
  };

  const handleCreate = async () => {
    if (!form.name || !form.related_id) {
      setAlert({ type: "warning", message: "Hãy chọn Lead/Customer và nhập tên." });
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
      exchange_rate: exchangeRate,
    };

    try {
      const result = await dispatch(createOpportunity(payload)).unwrap();
      // After creation, assign pipeline stage if selected
      setAlert({ type: "success", message: "Tạo Opportunity thành công!" });
      setTimeout(() => {
        navigate(`/crm/opportunities/${result.id}`);
      }, 700);
    } catch {
      setAlert({ type: "error", message: "Không thể tạo Opportunity" });
    }
  };

  return (
    <div className="page-container">
      <div className="erp-card max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-orange-500" />
            </span>
            <h1 className="text-base font-semibold text-gray-900">Tạo Opportunity mới</h1>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

          {/* Mode toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tạo từ</label>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-md">
              <button
                className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${mode === "lead" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                onClick={() => setMode("lead")}
              >
                Lead
              </button>
              <button
                className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${mode === "customer" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                onClick={() => setMode("customer")}
              >
                Customer
              </button>
            </div>
          </div>

          {/* Select Lead or Customer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {mode === "lead" ? "Chọn Lead" : "Chọn Customer"}
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              value={form.related_id}
              onChange={(e) => updateField("related_id", e.target.value)}
            >
              <option value="">-- {mode === "lead" ? "Chọn Lead" : "Chọn Customer"} --</option>
              {mode === "lead"
                ? allLeads.map((lead: Lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} — {lead.email ?? "no email"}
                    </option>
                  ))
                : partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.phone ?? "no phone"}
                    </option>
                  ))}
            </select>
          </div>

          {/* Pipeline selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pipeline</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              value={pipelineId || ""}
              onChange={(e) => handlePipelineChange(Number(e.target.value))}
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.is_default ? "(Mặc định)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Stage selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Giai đoạn khởi đầu</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              value={stageId || ""}
              onChange={(e) => setStageId(Number(e.target.value))}
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (sequence: {s.sequence}, prob: {Math.round(s.probability || 0)}%)
                  {s.is_won ? " — WON" : ""}{s.is_lost ? " — LOST" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Currency selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tiền tệ</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              value={currencyId || ""}
              onChange={(e) => {
                const cid = e.target.value ? Number(e.target.value) : null;
                setCurrencyId(cid);
                fetchExchangeRate(cid);
              }}
            >
              <option value="">-- Mặc định (VND) --</option>
              {currencies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Exchange rate display */}
          {currencyId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tỉ giá (VND → {currencies.find(c => c.id === currencyId)?.code || "?"})</label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value))}
              />
              <p className="text-xs text-gray-400 mt-1">
                Tỉ giá {currencies.find(c => c.id === currencyId)?.code || "?"} → VND. 
                Ví dụ: 1 EUR = {Math.round(exchangeRate).toLocaleString('vi-VN')} VND
              </p>
            </div>
          )}

          {/* Form fields */}
          <FormInput label="Tên Opportunity" value={form.name} onChange={(v) => updateField("name", v)} required placeholder="VD: Triển khai ERP cho công ty ABC" />
          <FormInput label="Giá trị kỳ vọng" value={form.expected_value} onChange={(v) => updateField("expected_value", v)} placeholder="50000000" type="number" />
          <FormInput label="Xác suất (%)" value={form.probability} onChange={(v) => updateField("probability", v)} placeholder="50" type="number" />
          <FormInput label="Ngày chốt dự kiến" value={form.closing_date} onChange={(v) => updateField("closing_date", v)} type="date" />
          <FormInput label="Hành động tiếp theo" value={form.next_action} onChange={(v) => updateField("next_action", v)} placeholder="VD: Gọi lại, gửi báo giá..." />
          <FormInput label="Ngày hành động tiếp" value={form.next_action_date} onChange={(v) => updateField("next_action_date", v)} type="date" />

          <Button variant="primary" fullWidth onClick={handleCreate}>
            Tạo Opportunity
          </Button>
        </div>
      </div>
    </div>
  );
}
