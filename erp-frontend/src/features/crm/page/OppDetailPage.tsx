import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import {
  fetchOpportunityDetail,
  changePipelineStage,
  markLost,
  markWon,
  deleteOpportunity,
} from "../store/opportunity/opportunity.thunks";
import * as activityService from "../service/activity.service";
import * as pipelineApi from "../api/pipeline.api";
import { Activity, TimelineEvent } from "../dto/activity.dto";
import { PipelineStage } from "../dto/pipeline.dto";
import { Currency } from "../../master-data/dto/currency.dto";
import * as currencyService from "../../master-data/service/currency.service";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Separator } from "@/components/ui/separator";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ActionConfirmModal } from "@/components/common";
import ActivityBoard from "../components/ActivityBoard";
import { CompactTimeline } from "../components/TimelineCard";
import InfoItem from "../components/InfoItem";
import OppStageActions from "../components/OppStageActions";
import StatCards from "../components/StatCards";
import { ArrowLeft, User, ChevronRight, GitBranch, Edit, Plus, ExternalLink } from "lucide-react";
import { formatVND, formatPercent, formatCurrency } from "@/utils/currency.helper";
import { formatStageProbability } from "../helpers/pipeline.helpers";
import { QuotationDto } from "@/features/sales/dto/quotation.dto";
import * as quotationService from "@/features/sales/service/quotation.service";

export default function OppDetailPage() {
  const { id } = useParams();
  const oppId = Number(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const opp = useAppSelector((s: RootState) => s.opportunity.detail);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [quotations, setQuotations] = useState<QuotationDto[]>([]);

  useEffect(() => {
    dispatch(fetchOpportunityDetail(oppId));
    loadActivities();
    loadTimeline();
    loadPipelineStages();
    loadCurrencies();
    quotationService.getQuotationsByOpportunity(oppId)
      .then(setQuotations)
      .catch(() => setQuotations([]));
  }, [oppId]);

  useEffect(() => {
    if (opp?.pipeline_id) loadPipelineStages();
  }, [opp]);

  const loadActivities = async () => {
    try {
      const res = await activityService.getActivitiesFor("opportunity", oppId);
      setActivities(res);
    } catch { /* ignore */ }
  };

  const loadTimeline = async () => {
    try {
      const res = await activityService.getTimeline("opportunity", oppId);
      setTimeline(res);
    } catch { /* ignore */ }
  };

  const loadPipelineStages = async () => {
    try {
      const res = await pipelineApi.getAllPipelines();
      const pipelines = res.data.data || [];
      const pipeline = pipelines.find((p: any) => p.id === opp?.pipeline_id);
      if (pipeline?.stages) {
        setStages(pipeline.stages.sort((a: PipelineStage, b: PipelineStage) => a.sequence - b.sequence));
      }
    } catch { /* ignore */ }
  };

  const loadCurrencies = async () => {
    try {
      const data = await currencyService.getCurrencies();
      setCurrencies(data || []);
    } catch { /* ignore */ }
  };

  if (!opp) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-600 text-sm">Đang tải...</p>
      </div>
    );
  }

  const currentStage = stages.find((s) => s.id === opp.pipeline_stage_id);
  const isWon = currentStage?.is_won || opp.stage === "won";
  const isLost = currentStage?.is_lost || opp.stage === "lost";
  const currency = currencies.find((c) => c.id === opp.currency_id);
  const currentStageProbabilityLabel = formatStageProbability(currentStage?.probability);

  // Activity groups
  const openActivities = activities.filter((a) => a.status === "pending" || a.status === "in_progress");
  const closedActivities = activities.filter((a) => a.status === "completed" || a.status === "cancelled");
  const getActivityUrl = (a: Activity) => `/crm/activities/${a.activity_type}/${a.id}`;

  // Related entity
  const relatedCustomer = opp.customer ?? null;
  const relatedLead = !relatedCustomer && opp.lead ? opp.lead : null;

  // Stage change handler
  const handleChangeStage = async (stageId: number) => {
    try {
      await dispatch(changePipelineStage({ oppId, newStageId: stageId })).unwrap();
      setAlert({ type: "success", message: "Đã chuyển giai đoạn thành công" });
    } catch {
      setAlert({ type: "error", message: "Không thể chuyển giai đoạn" });
    }
  };

  const handleWon = async () => {
    try {
      await dispatch(markWon(oppId)).unwrap();
      setAlert({ type: "success", message: "Đã đánh dấu THẮNG" });
    } catch {
      setAlert({ type: "error", message: "Không thể đánh dấu Thắng" });
    }
  };

  const handleLost = async (reason: string) => {
    try {
      await dispatch(markLost({ oppId, reason })).unwrap();
      setAlert({ type: "success", message: "Đã đánh dấu THUA" });
    } catch {
      setAlert({ type: "error", message: "Không thể đánh dấu Thua" });
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteOpportunity(oppId)).unwrap();
      navigate("/crm/opportunities");
    } catch {
      setAlert({ type: "error", message: "Không thể xóa Opportunity" });
    }
  };

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
              <GitBranch className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">{opp.name}</h1>
              <p className="text-xs text-gray-500 mt-0.5">Opportunity #{oppId}</p>
            </div>
            {isWon && <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">WON</span>}
            {isLost && <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">LOST</span>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit className="w-3.5 h-3.5" />}
              onClick={() => navigate(`/crm/opportunities/${oppId}/edit`)}
            >
              Chỉnh sửa
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => navigate(`/sales/quotations/create?opportunity_id=${oppId}`)}
            >
              Tạo Báo giá
            </Button>

            <OppStageActions
              currentStageId={opp.pipeline_stage_id}
              stages={stages}
              onChangeStage={handleChangeStage}
              onMarkWon={handleWon}
              onMarkLost={handleLost}
              onDelete={() => setShowDeleteConfirm(true)}
            />
          </div>
        </div>

        <div className="space-y-6 p-5">
          {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pipeline & Stage info */}
          {currentStage && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-gray-900">Pipeline & Giai đoạn</h2>
              </CardHeader>
              <Separator />
              <CardContent className="pt-5">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Pipeline:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {stages.length > 0 ? (opp.pipeline_id ? "Pipeline #" + opp.pipeline_id : "-") : "-"}
                    </span>
                  </div>
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
                    {currentStageProbabilityLabel && (
                      <span className="text-xs text-gray-400">({currentStageProbabilityLabel})</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quotations linked to this opportunity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Báo giá liên kết</h2>
                <button
                  onClick={() => navigate(`/sales/quotations/create?opportunity_id=${oppId}`)}
                  className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  <Plus className="w-3 h-3" /> Tạo mới
                </button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-0">
              {quotations.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Chưa có báo giá nào</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {quotations.map((q) => {
                    const statusColor: Record<string, string> = {
                      draft:     "bg-gray-100 text-gray-600",
                      sent:      "bg-blue-50 text-blue-600",
                      accepted:  "bg-emerald-50 text-emerald-700",
                      rejected:  "bg-red-50 text-red-600",
                      expired:   "bg-orange-50 text-orange-600",
                      cancelled: "bg-gray-100 text-gray-500",
                    };
                    const statusLabel: Record<string, string> = {
                      draft:     "Nháp",
                      sent:      "Đã gửi",
                      accepted:  "Chấp nhận",
                      rejected:  "Từ chối",
                      expired:   "Hết hạn",
                      cancelled: "Huỷ",
                    };
                    const qCurrency = q.currency;
                    const totalFmt = `${Number(q.total_after_tax).toLocaleString("vi-VN")} ${qCurrency?.symbol ?? "VND"}`;

                    return (
                      <div key={q.id} className="flex items-center justify-between py-3 px-1 hover:bg-gray-50 rounded transition group">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-800">{q.quotation_no}</span>
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusColor[q.status] ?? "bg-gray-100 text-gray-600"}`}>
                              {statusLabel[q.status] ?? q.status}
                            </span>
                            {q.version > 1 && (
                              <span className="text-[10px] text-gray-400">v{q.version}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-gray-400">
                              {new Date(q.quotation_date).toLocaleDateString("vi-VN")}
                            </span>
                            <span className="text-xs font-medium text-orange-600">{totalFmt}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/sales/quotations/${q.id}`)}
                          className="ml-3 p-1.5 rounded text-gray-300 hover:text-orange-500 hover:bg-orange-50 transition opacity-0 group-hover:opacity-100"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">Thông tin cơ bản</h2>
            </CardHeader>
            <Separator />
            <CardContent className="grid grid-cols-2 gap-6 pt-5">
              <InfoItem label="Tên" value={opp.name} />
              <InfoItem
                label="Giá trị kỳ vọng"
                value={currency ? `${formatCurrency(opp.expected_value, currency.symbol)} (${currency.code})` : formatVND(opp.expected_value)}
              />
              {currency && opp.exchange_rate && opp.exchange_rate !== 1 && (
                <InfoItem label="Giá trị quy đổi (VND)" value={formatVND((opp.expected_value ?? 0) * opp.exchange_rate)} />
              )}
              <InfoItem label="Xác suất" value={formatPercent(opp.probability ?? 0)} />
              <InfoItem label="Ngày chốt dự kiến" value={opp.closing_date ? new Date(opp.closing_date).toLocaleDateString("vi-VN") : "-"} />
              {opp.actual_close_date && (
                <InfoItem label="Ngày chốt thực tế" value={new Date(opp.actual_close_date).toLocaleDateString("vi-VN")} />
              )}
              <InfoItem label="Hành động tiếp theo" value={opp.next_action || "-"} />
              <InfoItem label="Ngày hành động tiếp" value={opp.next_action_date ? new Date(opp.next_action_date).toLocaleDateString("vi-VN") : "-"} />
              {currency && (
                <InfoItem 
                  label="Tiền tệ" 
                  value={`${currency.code} (${currency.symbol}) — Tỉ giá: 1 ${currency.code} = ${Math.round(opp.exchange_rate || 1).toLocaleString('vi-VN')} VND`} 
                />
              )}
            </CardContent>
          </Card>

          {/* Loss Reason — only when lost */}
          {isLost && (opp.loss_reason || opp.stage === "lost") && (
            <Card className="border-l-4 border-l-red-400">
              <CardHeader>
                <h2 className="text-sm font-semibold text-red-700">Lý do thua</h2>
              </CardHeader>
              <Separator />
              <CardContent className="pt-5">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{opp.loss_reason || "Không có lý do cụ thể"}</p>
              </CardContent>
            </Card>
          )}

          {/* Activities */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 px-1">Hoạt động</h2>
            <StatCards activities={activities} />
            <div className="grid grid-cols-2 gap-4">
              <ActivityBoard title="Open Activities" activities={openActivities} onClick={(a) => navigate(getActivityUrl(a))} />
              <ActivityBoard title="Active Tasks" activities={openActivities.filter((a) => a.activity_type === "task")} onClick={(a) => navigate(getActivityUrl(a))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ActivityBoard title="Completed" activities={closedActivities.filter((a) => a.status === "completed")} onClick={(a) => navigate(getActivityUrl(a))} />
              <ActivityBoard title="Cancelled" activities={closedActivities.filter((a) => a.status === "cancelled")} onClick={(a) => navigate(getActivityUrl(a))} />
            </div>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">Timeline</h2>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              <CompactTimeline items={timeline} />
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Owner */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">Người phụ trách</h2>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              {opp.owner ? (
                <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{opp.owner.full_name}</p>
                    <p className="text-xs text-gray-500">{opp.owner.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-6">Chưa phân công</p>
              )}
            </CardContent>
          </Card>

          {/* Related To */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">Liên kết</h2>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-4">
              {relatedCustomer && (
                <button
                  onClick={() => navigate(`/partners/${relatedCustomer.id}`)}
                  className="w-full flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition"
                >
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{relatedCustomer.name}</p>
                    <p className="text-xs text-gray-500">{relatedCustomer.phone ?? "No phone"}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )}
              {!relatedCustomer && relatedLead && (
                <button
                  onClick={() => navigate(`/crm/leads/${relatedLead.id}`)}
                  className="w-full flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition"
                >
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{relatedLead.name}</p>
                    <p className="text-xs text-gray-500">{relatedLead.email ?? "No email"}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )}
              {!relatedCustomer && !relatedLead && (
                <p className="text-gray-400 text-sm text-center py-4">Không có</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>

      {/* Delete confirmation */}
      <ActionConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Xóa Opportunity"
        description={`Bạn có chắc chắn muốn xóa "${opp.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
