import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import { useParams } from "react-router-dom";
import { 
  updateLeadBasic, 
  updateLeadEvaluation, 
  convertLead, 
  markLeadLost, 
  reopenLead, 
  deleteLead,
//   reassignLead 
} from "../store/lead/lead.thunks";
import { fetchActivitiesFor } from "../store/activitySlice";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { FormInput } from "../../../components/ui/FormInput";
import { 
  ArrowLeft, User, Mail, Phone, Globe, Edit2, Check, X, 
  Trash2, RefreshCw, Calendar, CheckCircle, XCircle, Clock,
  DollarSign, TrendingUp, Users
} from "lucide-react";
import { UpdateLeadBasicDto, UpdateLeadEvaluationDto } from "../dto/lead.dto";

// interface LeadDetailPageProps {
//   leadId: number;
// }

export default function LeadDetailPage() {
    const { id } = useParams();
  const leadId = Number(id); // convert sang number
  const dispatch = useDispatch<AppDispatch>();
  const { allLeads } = useSelector((state: RootState) => state.lead);
  const { related: activities, loading: activitiesLoading } = useSelector((state: RootState) => state.activity);
  const lead = allLeads.find(l => l.id === leadId);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [editBasicMode, setEditBasicMode] = useState(false);
  const [editEvalMode, setEditEvalMode] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReason, setLostReason] = useState("");

  const [basicForm, setBasicForm] = useState<UpdateLeadBasicDto>({
    name: lead?.name || "",
    email: lead?.email || "",
    phone: lead?.phone || "",
    source: lead?.source || ""
  });

  const [evalForm, setEvalForm] = useState<UpdateLeadEvaluationDto>({
    leadId: leadId,
    has_budget: lead?.has_budget,
    ready_to_buy: lead?.ready_to_buy,
    expected_timeline: lead?.expected_timeline || "",
    notes: ""
  });

  useEffect(() => {
    if (lead) {
      setBasicForm({
        name: lead.name,
        email: lead.email || "",
        phone: lead.phone || "",
        source: lead.source || ""
      });
      setEvalForm({
        leadId: leadId,
        has_budget: lead.has_budget,
        ready_to_buy: lead.ready_to_buy,
        expected_timeline: lead.expected_timeline || "",
        notes: ""
      });
    }
  }, [lead, leadId]);

  useEffect(() => {
    dispatch(fetchActivitiesFor({ type: "lead", id: leadId }));
  }, [dispatch, leadId]);

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Lead not found</h2>
          <p className="text-gray-500 mt-2">The lead you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const handleUpdateBasic = async () => {
    try {
      await dispatch(updateLeadBasic({ leadId, data: basicForm })).unwrap();
      setAlert({ type: 'success', message: 'Basic information updated successfully!' });
      setEditBasicMode(false);
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message:  (error as string)||'Failed to update basic information' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleUpdateEvaluation = async () => {
    try {
      await dispatch(updateLeadEvaluation({ leadId, data: evalForm })).unwrap();
      setAlert({ type: 'success', message: 'Evaluation updated successfully!' });
      setEditEvalMode(false);
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message:  (error as string)|| 'Failed to update evaluation' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleConvert = async () => {
    if (window.confirm('Convert this lead to an opportunity?')) {
      try {
        await dispatch(convertLead(leadId)).unwrap();
        setAlert({ type: 'success', message: 'Lead converted to opportunity!' });
        setTimeout(() => setAlert(null), 3000);
      } catch (error) {
        setAlert({ type: 'error', message: (error as string)|| 'Failed to convert lead' });
        setTimeout(() => setAlert(null), 3000);
      }
    }
  };

  const handleMarkLost = async () => {
    if (!lostReason.trim()) {
      setAlert({ type: 'warning', message: 'Please provide a reason' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    try {
      await dispatch(markLeadLost({ leadId, reason: lostReason })).unwrap();
      setAlert({ type: 'success', message: 'Lead marked as lost' });
      setShowLostModal(false);
      setLostReason("");
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message:  (error as string)||'Failed to mark lead as lost' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleReopen = async () => {
    if (window.confirm('Reopen this lead?')) {
      try {
        await dispatch(reopenLead(leadId)).unwrap();
        setAlert({ type: 'success', message: 'Lead reopened successfully!' });
        setTimeout(() => setAlert(null), 3000);
      } catch (error) {
        setAlert({ type: 'error', message: (error as string)||'Failed to reopen lead' });
        setTimeout(() => setAlert(null), 3000);
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      try {
        await dispatch(deleteLead(leadId)).unwrap();
        setAlert({ type: 'success', message: 'Lead deleted successfully!' });
        setTimeout(() => {
          window.location.href = '/crm/lead';
        }, 1500);
      } catch (error) {
        setAlert({ type: 'error', message: (error as string)|| 'Failed to delete lead' });
        setTimeout(() => setAlert(null), 3000);
      }
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      qualified: "bg-green-100 text-green-800",
      lost: "bg-red-100 text-red-800"
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
  };

  const formatStage = (stage: string) => {
    return stage.charAt(0).toUpperCase() + stage.slice(1);
  };

  const groupedActivities = {
    call: activities.filter(a => a.activity_type === 'call'),
    email: activities.filter(a => a.activity_type === 'email'),
    meeting: activities.filter(a => a.activity_type === 'meeting'),
    task: activities.filter(a => a.activity_type === 'task')
  };

  const handleActivityClick = (activityId: number, type: string) => {
    window.location.href = `/crm/activity/${type}/${activityId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Alert */}
        {alert && (
          <div className="mb-4">
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.history.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold text-gray-900">{lead.name}</h1>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStageColor(lead.stage)}`}>
                      {formatStage(lead.stage)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Lead ID: {lead.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {lead.stage === 'qualified' && (
                  <Button variant="primary" onClick={handleConvert}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Convert to Opportunity
                  </Button>
                )}
                {lead.stage !== 'lost' && (
                  <Button variant="outline" onClick={() => setShowLostModal(true)}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Mark Lost
                  </Button>
                )}
                {lead.stage === 'lost' && (
                  <Button variant="outline" onClick={handleReopen}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reopen
                  </Button>
                )}
                <Button variant="outline" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                {!editBasicMode ? (
                  <button
                    onClick={() => setEditBasicMode(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateBasic}
                      className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                    </button>
                    <button
                      onClick={() => setEditBasicMode(false)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-6 space-y-4">
                {editBasicMode ? (
                  <>
                    <FormInput
                      label="Name"
                      value={basicForm.name || ""}
                      onChange={(value) => setBasicForm({ ...basicForm, name: value })}
                      icon={<User className="w-4 h-4 text-gray-400" />}
                    />
                    <FormInput
                      label="Email"
                      type="email"
                      value={basicForm.email || ""}
                      onChange={(value) => setBasicForm({ ...basicForm, email: value })}
                      icon={<Mail className="w-4 h-4 text-gray-400" />}
                    />
                    <FormInput
                      label="Phone"
                      value={basicForm.phone || ""}
                      onChange={(value) => setBasicForm({ ...basicForm, phone: value })}
                      icon={<Phone className="w-4 h-4 text-gray-400" />}
                    />
                    <FormInput
                      label="Source"
                      value={basicForm.source || ""}
                      onChange={(value) => setBasicForm({ ...basicForm, source: value })}
                      icon={<Globe className="w-4 h-4 text-gray-400" />}
                    />
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <div className="flex items-center mt-1">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{lead.email || "-"}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <div className="flex items-center mt-1">
                        <Phone className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{lead.phone || "-"}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Source</label>
                      <div className="flex items-center mt-1">
                        <Globe className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{lead.source || "-"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Evaluation */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Lead Evaluation</h2>
                {!editEvalMode ? (
                  <button
                    onClick={() => setEditEvalMode(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateEvaluation}
                      className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                    </button>
                    <button
                      onClick={() => setEditEvalMode(false)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-6 space-y-4">
                {editEvalMode ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Has Budget?</label>
                      <select
                        value={evalForm.has_budget === null ? "" : String(evalForm.has_budget)}
                        onChange={(e) => setEvalForm({ 
                          ...evalForm, 
                          has_budget: e.target.value === "" ? undefined : e.target.value === "true" 
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                      >
                        <option value="">Unknown</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Ready to Buy?</label>
                      <select
                        value={evalForm.ready_to_buy === null ? "" : String(evalForm.ready_to_buy)}
                        onChange={(e) => setEvalForm({ 
                          ...evalForm, 
                          ready_to_buy: e.target.value === "" ? undefined : e.target.value === "true" 
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                      >
                        <option value="">Unknown</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <FormInput
                      label="Expected Timeline"
                      value={evalForm.expected_timeline || ""}
                      onChange={(value) => setEvalForm({ ...evalForm, expected_timeline: value })}
                      placeholder="e.g., this_week, this_month"
                    />
                  </>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <DollarSign className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <div className="text-sm text-gray-500">Has Budget</div>
                      <div className="mt-1 font-semibold">
                        {lead.has_budget === null ? "-" : lead.has_budget ? "Yes" : "No"}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <div className="text-sm text-gray-500">Ready to Buy</div>
                      <div className="mt-1 font-semibold">
                        {lead.ready_to_buy === null ? "-" : lead.ready_to_buy ? "Yes" : "No"}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Clock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <div className="text-sm text-gray-500">Timeline</div>
                      <div className="mt-1 font-semibold">
                        {lead.expected_timeline || "-"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Activities */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Activities</h2>
              </div>
              <div className="p-6">
                {activitiesLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No activities found
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedActivities).map(([type, items]) => (
                      items.length > 0 && (
                        <div key={type}>
                          <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
                            {type}s ({items.length})
                          </h3>
                          <div className="space-y-2">
                            {items.map(activity => (
                              <div
                                key={activity.id}
                                onClick={() => handleActivityClick(activity.id, type)}
                                className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition-colors"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                      {activity.subject || "(No subject)"}
                                    </div>
                                    {activity.notes && (
                                      <div className="text-sm text-gray-600 mt-1">{activity.notes}</div>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                      {activity.due_at && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {new Date(activity.due_at).toLocaleDateString()}
                                        </span>
                                      )}
                                      {activity.owner && (
                                        <span className="flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          {activity.owner.full_name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                    activity.done 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {activity.done ? 'Completed' : 'Pending'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Owner Info */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Lead Owner</h2>
              </div>
              <div className="p-6">
                {lead.assignedUser ? (
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{lead.assignedUser.full_name}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Mail className="w-3 h-3" />
                        {lead.assignedUser.email}
                      </div>
                      {lead.assignedUser.phone && (
                        <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {lead.assignedUser.phone}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No owner assigned
                  </div>
                )}
              </div>
            </div>

            {/* Lost Reason (if lost) */}
            {lead.stage === 'lost' && lead.lost_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-900 mb-2">Lost Reason</h3>
                <p className="text-sm text-red-700">{lead.lost_reason}</p>
                {lead.lost_at && (
                  <p className="text-xs text-red-600 mt-2">
                    Lost on: {new Date(lead.lost_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lost Modal */}
        {showLostModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Mark Lead as Lost</h3>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 resize-none"
                  rows={4}
                  placeholder="Why is this lead being marked as lost?"
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <Button variant="outline" onClick={() => {
                  setShowLostModal(false);
                  setLostReason("");
                }}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleMarkLost}>
                  Mark as Lost
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}