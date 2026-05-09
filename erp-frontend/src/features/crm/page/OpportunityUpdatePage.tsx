import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import {
  fetchOpportunityDetail,
  updateOpportunity,
} from "../store/opportunity/opportunity.thunks";
import { UpdateOpportunityDto } from "../dto/opportunity.dto";
import { PipelineStage } from "../dto/pipeline.dto";
import * as pipelineApi from "../api/pipeline.api";
import { Currency } from "../../master-data/dto/currency.dto";
import * as currencyService from "../../master-data/service/currency.service";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { UiAlert } from "@/types/ui";
import { toDateInputValue } from "@/utils/time.helper";
import { ArrowLeft, Edit } from "lucide-react";

export default function OpportunityUpdatePage() {
  const { id } = useParams();
  const oppId = Number(id);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const detail = useAppSelector((s: RootState) => s.opportunity.detail);
  const { loading, error } = useAppSelector((s: RootState) => s.opportunity);
  const [alert, setAlert] = useState<UiAlert | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currencyId, setCurrencyId] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [pipelineName, setPipelineName] = useState<string>("-");

  const [form, setForm] = useState({
    name: "",
    expected_value: "",
    probability: "",
    closing_date: "",
    next_action: "",
    next_action_date: "",
    actual_close_date: "",
    notes: "",
  });

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    dispatch(fetchOpportunityDetail(oppId));
    loadCurrencies();
  }, [dispatch, oppId]);

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

  useEffect(() => {
    if (detail) {
      setForm({
        name: detail.name ?? "",
        expected_value: detail.expected_value?.toString() ?? "",
        probability: detail.probability?.toString() ?? "",
        closing_date: toDateInputValue(detail.closing_date),
        next_action: detail.next_action ?? "",
        next_action_date: toDateInputValue(detail.next_action_date),
        actual_close_date: toDateInputValue(detail.actual_close_date),
        notes: detail.loss_reason ?? "",
      });
      if (detail.pipeline_id) loadPipelineInfo(detail.pipeline_id);
      if (detail.currency_id) setCurrencyId(detail.currency_id);
    }
  }, [detail]);

  useEffect(() => {
    if (detail?.currency_id && currencies.length > 0) {
      fetchExchangeRate(detail.currency_id);
    }
  }, [detail, currencies]);

  const loadPipelineInfo = async (pipelineId: number) => {
    try {
      const res = await pipelineApi.getAllPipelines();
      const pipelines = res.data.data || [];
      const pipeline = pipelines.find((p: any) => p.id === pipelineId);
      if (pipeline) {
        setPipelineName(pipeline.name);
        if (pipeline.stages) {
          setStages(pipeline.stages.sort((a: PipelineStage, b: PipelineStage) => a.sequence - b.sequence));
        }
      }
    } catch { /* ignore */ }
  };

  const currentStage = stages.find((s) => s.id === detail?.pipeline_stage_id);

  const handleUpdate = async () => {
    const payload: UpdateOpportunityDto = {
      oppId,
      name: form.name,
      expected_value: form.expected_value ? Number(form.expected_value) : undefined,
      probability: form.probability ? Number(form.probability) : undefined,
      closing_date: form.closing_date || null,
      next_action: form.next_action || null,
      next_action_date: form.next_action_date || null,
      actual_close_date: form.actual_close_date || null,
      notes: form.notes || undefined,
      currency_id: currencyId,
      exchange_rate: exchangeRate,
    };

    try {
      await dispatch(updateOpportunity({ data: payload })).unwrap();
      setAlert({ type: "success", message: "Cập nhật Opportunity thành công!" });
      setTimeout(() => {
        navigate(`/crm/opportunities/${oppId}`);
      }, 800);
    } catch {
      setAlert({ type: "error", message: "Cập nhật thất bại" });
    }
  };

  if (!detail) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-600 text-sm">Đang tải...</p>
      </div>
    );
  }

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
              <Edit className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Cập nhật Opportunity</h1>
              <p className="text-xs text-gray-400 mt-0.5">#{oppId} — {detail.name}</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}
          {error && <Alert type="error" message={error} />}

          {/* Pipeline & Stage (read-only) */}
          {detail.pipeline_id && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">Pipeline & Giai đoạn (chỉ đọc)</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Pipeline:</span>
                  <span className="text-sm font-medium text-gray-800">{pipelineName}</span>
                </div>
                {currentStage && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Giai đoạn:</span>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm font-medium"
                      style={{
                        borderColor: currentStage.color || "#f97316",
                        backgroundColor: (currentStage.color || "#f97316") + "15",
                        color: currentStage.color || "#f97316",
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentStage.color || "#f97316" }} />
                      {currentStage.name}
                    </span>
                    <span className="text-xs text-gray-400">({Math.round(currentStage.probability || 0)}%)</span>
                    {currentStage.is_won && <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">WON</span>}
                    {currentStage.is_lost && <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">LOST</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          <FormInput label="Tên Opportunity" value={form.name} onChange={(v) => updateField("name", v)} required />
          <FormInput label="Giá trị kỳ vọng" value={form.expected_value} onChange={(v) => updateField("expected_value", v)} type="number" />
          <FormInput label="Xác suất (%)" value={form.probability} onChange={(v) => updateField("probability", v)} type="number" />

          {/* Currency */}
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
                Ví dụ: 1 {currencies.find(c => c.id === currencyId)?.code || "?"} = {Math.round(exchangeRate).toLocaleString('vi-VN')} VND
              </p>
            </div>
          )}

          <FormInput label="Ngày chốt dự kiến" value={form.closing_date ?? ""} onChange={(v) => updateField("closing_date", v)} type="date" />
          <FormInput label="Hành động tiếp theo" value={form.next_action} onChange={(v) => updateField("next_action", v)} placeholder="VD: Gọi lại khách hàng, gửi báo giá..." />
          <FormInput label="Ngày hành động tiếp" value={form.next_action_date ?? ""} onChange={(v) => updateField("next_action_date", v)} type="date" />
          <FormInput label="Ngày chốt thực tế" value={form.actual_close_date ?? ""} onChange={(v) => updateField("actual_close_date", v)} type="date" />
          <FormInput label="Ghi chú" value={form.notes} onChange={(v) => updateField("notes", v)} textarea />

          <Button variant="primary" fullWidth loading={loading} onClick={handleUpdate}>
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );
}
