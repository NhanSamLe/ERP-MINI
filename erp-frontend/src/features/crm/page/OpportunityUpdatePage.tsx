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
import { toast } from "react-toastify";
import { formatStageProbability } from "../helpers/pipeline.helpers";
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
  const currentStageProbabilityLabel = formatStageProbability(currentStage?.probability);

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
      toast.success("Cập nhật Opportunity thành công!");
      setTimeout(() => {
        navigate(`/crm/opportunities/${oppId}`);
      }, 800);
    } catch {
      toast.error("Cập nhật thất bại");
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
      <div className="erp-card mx-auto max-w-5xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate(-1)}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Quay lại"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Edit className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Cập nhật Opportunity</h1>
              <p className="text-xs text-gray-500 mt-0.5">#{oppId} — {detail.name}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5">
          {error && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 mb-4">{error}</div>}

          {detail.pipeline_id && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase text-gray-500 mb-3">Pipeline & Giai đoạn</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="font-medium text-gray-900">Quy trình:</span>
                  <span>{pipelineName}</span>
                </div>
                {currentStage && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-gray-500">Giai đoạn:</span>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-medium"
                      style={{
                        borderColor: currentStage.color || "#f97316",
                        backgroundColor: (currentStage.color || "#f97316") + "15",
                        color: currentStage.color || "#f97316",
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentStage.color || "#f97316" }} />
                      {currentStage.name}
                    </span>
                    {currentStageProbabilityLabel && (
                      <span className="text-xs text-gray-400">({currentStageProbabilityLabel})</span>
                    )}
                    {currentStage.is_won && <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">THẮNG</span>}
                    {currentStage.is_lost && <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">THUA</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label="Tên cơ hội kinh doanh" value={form.name} onChange={(v) => updateField("name", v)} required />
            <FormInput label="Giá trị kỳ vọng" value={form.expected_value} onChange={(v) => updateField("expected_value", v)} type="number" />
            <FormInput label="Xác suất (%)" value={form.probability} onChange={(v) => updateField("probability", v)} type="number" />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tiền tệ</label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
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
          </div>

          {currencyId && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <div className="font-medium text-gray-900 mb-1">Tỷ giá</div>
              <div>
                1 {currencies.find((c) => c.id === currencyId)?.code || "?"} = {Math.round(exchangeRate).toLocaleString("vi-VN")} VND
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label="Ngày chốt dự kiến" value={form.closing_date ?? ""} onChange={(v) => updateField("closing_date", v)} type="date" />
            <FormInput label="Hành động tiếp theo" value={form.next_action} onChange={(v) => updateField("next_action", v)} placeholder="VD: Gọi lại khách hàng, gửi báo giá..." />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label="Ngày hành động tiếp" value={form.next_action_date ?? ""} onChange={(v) => updateField("next_action_date", v)} type="date" />
            <FormInput label="Ngày chốt thực tế" value={form.actual_close_date ?? ""} onChange={(v) => updateField("actual_close_date", v)} type="date" />
          </div>

          <FormInput label="Ghi chú" value={form.notes} onChange={(v) => updateField("notes", v)} textarea />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Hủy
            </Button>
            <Button variant="primary" loading={loading} onClick={handleUpdate}>
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
