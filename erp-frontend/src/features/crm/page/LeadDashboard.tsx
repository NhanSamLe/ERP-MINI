import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import { fetchAllLeads, fetchTodayLeads, deleteLead } from "../store/lead/lead.thunks";
import { DataTable } from "../../../components/ui/DataTable";
import { Alert } from "../../../components/ui/Alert";
import { Column } from "../../../types/common";
import { Lead } from "../dto/lead.dto";
import { RefreshCw, Plus, Phone, Mail, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LeadDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { allLeads, todayLeads, loading, error } = useSelector(
    (state: RootState) => state.lead
  );
//   const user = useSelector((s: RootState) => s.auth.user);

  const [selectedView, setSelectedView] = useState<"all" | "today">("all");
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);

  useEffect(() => {
    dispatch(fetchAllLeads());
    dispatch(fetchTodayLeads());
  }, [dispatch]);

  const displayLeads = selectedView === "all" ? allLeads : todayLeads;

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      qualified: "bg-green-100 text-green-800",
      lost: "bg-red-100 text-red-800"
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
  };

  const formatStage = (stage: string) => {
    return stage.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const columns: Column<Lead>[] = [
    {
      key: "name",
      label: "Lead Name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
            <User className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            {row.source && (
              <div className="text-xs text-gray-500">{row.source}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (row) => row.email ? (
        <div className="flex items-center text-sm">
          <Mail className="w-4 h-4 mr-2 text-gray-400" />
          <span className="text-gray-900">{row.email}</span>
        </div>
      ) : (
        <span className="text-gray-400">-</span>
      )
    },
    {
      key: "phone",
      label: "Phone",
      sortable: true,
      render: (row) => row.phone ? (
        <div className="flex items-center text-sm">
          <Phone className="w-4 h-4 mr-2 text-gray-400" />
          <span className="text-gray-900">{row.phone}</span>
        </div>
      ) : (
        <span className="text-gray-400">-</span>
      )
    },
    {
      key: "stage",
      label: "Stage",
      sortable: true,
      render: (row) => (
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageColor(row.stage)}`}>
          {formatStage(row.stage)}
        </span>
      )
    },
    {
      key: "has_budget",
      label: "Budget",
      sortable: true,
      render: (row) => {
        if (row.has_budget === null || row.has_budget === undefined) {
          return <span className="text-gray-400">-</span>;
        }
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${row.has_budget ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {row.has_budget ? 'Yes' : 'No'}
          </span>
        );
      }
    },
    {
      key: "ready_to_buy",
      label: "Ready to Buy",
      sortable: true,
      render: (row) => {
        if (row.ready_to_buy === null || row.ready_to_buy === undefined) {
          return <span className="text-gray-400">-</span>;
        }
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${row.ready_to_buy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {row.ready_to_buy ? 'Yes' : 'No'}
          </span>
        );
      }
    },
    {
      key: "expected_timeline",
      label: "Timeline",
      sortable: true,
      render: (row) => row.expected_timeline ? (
        <span className="text-sm text-gray-900">
          {row.expected_timeline.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
      ) : (
        <span className="text-gray-400">-</span>
      )
    },
    {
      key: "assigned_to",
      label: "Owner",
      sortable: true,
      render: (row) => row.assignedUser ? (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{row.assignedUser.full_name}</div>
          <div className="text-xs text-gray-500">{row.assignedUser.email}</div>
        </div>
      ) : (
        <span className="text-gray-400">Unassigned</span>
      )
    }
  ];

  const handleRefresh = async () => {
    try {
      await dispatch(fetchAllLeads()).unwrap();
      await dispatch(fetchTodayLeads()).unwrap();
      setAlert({ type: 'success', message: 'Leads refreshed successfully!' });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({
                type: 'error',
                message: (error as string) || 'Failed to refresh leads'
                });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  // const handleView = (lead: Lead) => {
  //   navigate(`/crm/lead/${lead.id}`);
  // };

  // const handleEdit = (lead: Lead) => {
  //   navigate(`/crm/lead/${lead.id}/edit`);
  // };

  const handleDelete = async (lead: Lead) => {
    if (window.confirm(`Are you sure you want to delete lead "${lead.name}"?`)) {
      try {
        await dispatch(deleteLead(lead.id)).unwrap();
        setAlert({ type: 'success', message: `Lead "${lead.name}" deleted successfully!` });
        setTimeout(() => setAlert(null), 3000);
      } catch (error) {
        setAlert({ type: 'error', message:  (error as string) ||'Failed to delete lead' });
        setTimeout(() => setAlert(null), 3000);
      }
    }
  };

  const handleCreateLead = () => {
    navigate("/crm/lead/create");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Alert */}
        {alert && (
          <div className="mb-4">
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage and track your sales leads
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedView("all")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedView === "all"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    All Leads ({allLeads.length})
                  </button>
                  <button
                    onClick={() => setSelectedView("today")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedView === "today"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Today ({todayLeads.length})
                  </button>
                </div>

                <button
                  onClick={handleRefresh}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
                  title="Refresh"
                  disabled={loading}
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={handleCreateLead}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Lead</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500">New Leads</div>
              <div className="text-2xl font-semibold text-blue-600 mt-1">
                {allLeads.filter(l => l.stage === 'new').length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500">Qualified</div>
              <div className="text-2xl font-semibold text-green-600 mt-1">
                {allLeads.filter(l => l.stage === 'qualified').length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500">Lost</div>
              <div className="text-2xl font-semibold text-red-600 mt-1">
                {allLeads.filter(l => l.stage === 'lost').length}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-6 py-4">
              <Alert type="error" message={error} />
            </div>
          )}

          {/* Table */}
          <div className="p-6">
            <DataTable
              columns={columns}
              data={displayLeads}
              loading={loading}
              searchable={true}
              searchKeys={["name", "email", "phone", "source"]}
              showSelection={false}
              showActions={false}
              // onView={handleView}
              // onEdit={handleEdit}
            //   onDelete={user?.role.code === "SALESMANAGER" ? handleDelete : undefined}
              onDelete={handleDelete}
              onRowClick={(lead) => navigate(`/crm/leads/${lead.id}`)}
              itemsPerPage={10}
            />
          </div>
        </div>
      </div>
    </div>
  );
}