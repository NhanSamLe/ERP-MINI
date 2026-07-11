import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAllLeads, fetchTodayLeads, deleteLead } from "../store/lead/lead.thunks";
import { importLeads } from "../api/lead.api";
import { DataTable } from "@/components/ui/DataTable";
import { ActionConfirmModal } from "@/components/common";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { Column } from "@/types/common";
import { Lead } from "../dto/lead.dto";
import { RefreshCw, Plus, Phone, Mail, User, Upload, Download, Search, Users, TableProperties } from "lucide-react";
import { exportExcelReport } from "@/utils/excel/exportExcelReport";

const STAGE_TABS = [
  { label: "Tất cả",     value: "" },
  { label: "Mới",        value: "new" },
  { label: "Qualified",  value: "qualified" },
  { label: "Thua",       value: "lost" },
];

const getStageBadge = (stage: string) => {
  const map: Record<string, string> = {
    new:       "bg-blue-100 text-blue-800",
    qualified: "bg-green-100 text-green-800",
    lost:      "bg-red-100 text-red-800",
  };
  return map[stage] || "bg-gray-100 text-gray-800";
};

const formatStage = (stage: string) =>
  stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Column width constants for consistent sizing
const COLUMN_MIN_WIDTHS = {
  LEAD_NAME: 'min-w-[200px] md:min-w-[280px]',
} as const;

export default function LeadDashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { allLeads, loading, error } = useAppSelector((s) => s.lead);
  const user = useAppSelector((s) => s.auth.user);


  const [stageFilter, setStageFilter] = useState("");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchAllLeads());
    dispatch(fetchTodayLeads());
  }, [dispatch]);

  const filtered = useMemo(() => {
    let list = allLeads;
    if (stageFilter) list = list.filter((l) => l.stage === stageFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q) ||
          l.source?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allLeads, stageFilter, search]);

  const counts = useMemo(
    () => ({
      all:       allLeads.length,
      new:       allLeads.filter((l) => l.stage === "new").length,
      qualified: allLeads.filter((l) => l.stage === "qualified").length,
      lost:      allLeads.filter((l) => l.stage === "lost").length,
    }),
    [allLeads]
  );

  const handleImport = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importLeads(file);
      toast.success("Import Leads thành công!");
      dispatch(fetchAllLeads());
      dispatch(fetchTodayLeads());
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi import leads");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExport = async () => {
    try {
      await exportExcelReport({
        title: "DANH SÁCH KHÁCH HÀNG TIỀM NĂNG (LEADS)",
        columns: [
          { header: "Mã Lead", key: "id", width: 10 },
          { header: "Tên Lead", key: "name", width: 30 },
          { header: "Email", key: "email", width: 25 },
          { header: "SĐT", key: "phone", width: 15 },
          { header: "Nguồn", key: "source", width: 15 },
          { header: "Công ty", key: "company_name", width: 25 },
          { header: "Chức vụ", key: "job_title", width: 20 },
          { header: "Ngành", key: "industry", width: 18 },
          { header: "Quy mô", key: "company_size", width: 15 },
          { header: "Doanh thu năm", key: "annual_revenue", width: 18 },
          { header: "Giai đoạn", key: "stage", width: 15, formatter: (v: any) => String(v).toUpperCase() },
          { header: "Điểm", key: "lead_score", width: 10 },
          { header: "Hạng điểm", key: "score_grade", width: 12 },
          { header: "Người phụ trách", key: "assignedUser", width: 25, formatter: (v: any) => v?.full_name || "-" },
          { header: "Đạt chất lượng lúc", key: "qualified_at", width: 18, formatter: (v: any) => (v ? new Date(v).toLocaleString("vi-VN") : "") },
          { header: "Đạt chất lượng bởi", key: "qualified_by", width: 15 },
          { header: "Ngày thua", key: "lost_at", width: 18, formatter: (v: any) => (v ? new Date(v).toLocaleString("vi-VN") : "") },
          { header: "Lý do thua", key: "lost_reason", width: 30 },
          { header: "Liên hệ lần đầu", key: "contacted_at", width: 18, formatter: (v: any) => (v ? new Date(v).toLocaleString("vi-VN") : "") },
          { header: "Hoạt động gần nhất", key: "last_activity_date", width: 18, formatter: (v: any) => (v ? new Date(v).toLocaleString("vi-VN") : "") },
          { header: "Ngày tạo", key: "created_at", width: 15, formatter: (v: any) => (v ? new Date(v).toLocaleDateString("vi-VN") : "") },
          { header: "Cập nhật", key: "updated_at", width: 18, formatter: (v: any) => (v ? new Date(v).toLocaleString("vi-VN") : "") },
        ],
        data: filtered,
        fileName: `Bao_Cao_Leads_${Date.now()}.xlsx`,
        footer: { creator: user?.full_name || "Admin" },
      });
      toast.success("Xuất báo cáo thành công");
    } catch {
      toast.error("Lỗi xuất báo cáo");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteLead(deleteTarget.id)).unwrap();
      toast.success(`Đã xóa Lead "${deleteTarget.name}"`);
    } catch {
      toast.error("Không thể xóa Lead");
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns: Column<Lead>[] = [
    {
      key: "name",
      label: "Tên Lead",
      sortable: true,
      render: (row) => (
        <div className={`flex items-center gap-3 ${COLUMN_MIN_WIDTHS.LEAD_NAME}`}>
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate" title={row.name}>
              {row.name}
            </div>
            {row.source && (
              <div className="text-xs text-gray-400 truncate" title={row.source}>
                {row.source}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (row) =>
        row.email ? (
          <div className="flex items-center text-sm gap-1.5">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-700">{row.email}</span>
          </div>
        ) : <span className="text-gray-400">—</span>,
    },
    {
      key: "phone",
      label: "SĐT",
      sortable: true,
      render: (row) =>
        row.phone ? (
          <div className="flex items-center text-sm gap-1.5">
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-700">{row.phone}</span>
          </div>
        ) : <span className="text-gray-400">—</span>,
    },
    {
      key: "stage",
      label: "Giai đoạn",
      sortable: true,
      render: (row) => (
        <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full ${getStageBadge(row.stage)}`}>
          {formatStage(row.stage)}
        </span>
      ),
    },
    {
      key: "lead_score",
      label: "Điểm",
      sortable: true,
      render: (row) => {
        const grade = row.score_grade ?? "cold";
        const cls = grade === "hot" ? "bg-red-100 text-red-700" : grade === "warm" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700";
        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{row.lead_score ?? 0}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{grade.toUpperCase()}</span>
          </div>
        );
      },
    },
    {
      key: "company_name",
      label: "Công ty",
      sortable: true,
      render: (row) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{row.company_name || "—"}</div>
          <div className="text-xs text-gray-400">{row.job_title || row.industry || "—"}</div>
        </div>
      ),
    },
    {
      key: "has_budget",
      label: "Ngân sách",
      sortable: true,
      render: (row) =>
        row.has_budget == null
          ? <span className="text-gray-400">—</span>
          : (
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${row.has_budget ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {row.has_budget ? "Có" : "Không"}
            </span>
          ),
    },
    {
      key: "ready_to_buy",
      label: "Sẵn sàng mua",
      sortable: true,
      render: (row) =>
        row.ready_to_buy == null
          ? <span className="text-gray-400">—</span>
          : (
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${row.ready_to_buy ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {row.ready_to_buy ? "Có" : "Không"}
            </span>
          ),
    },
    {
      key: "expected_timeline",
      label: "Thời gian dự kiến",
      sortable: true,
      render: (row) => {
        const TIMELINE_LABELS: Record<string, string> = {
          this_week: "Tuần này",
          this_month: "Tháng này",
          next_quarter: "Quý tới",
        };
        return row.expected_timeline ? (
          <span className="text-sm text-gray-700">
            {TIMELINE_LABELS[row.expected_timeline] || row.expected_timeline}
          </span>
        ) : <span className="text-gray-400">—</span>;
      },
    },
    {
      key: "assigned_to",
      label: "Người phụ trách",
      sortable: true,
      render: (row) =>
        row.assignedUser ? (
          <div className="text-sm">
            <div className="font-medium text-gray-900">{row.assignedUser.full_name}</div>
            <div className="text-xs text-gray-400">{row.assignedUser.email}</div>
          </div>
        ) : <span className="text-gray-400">Chưa phân công</span>,
    },
  ];

  return (
    <div className="page-container">


      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      <div className="erp-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Danh sách Lead</h1>
              <p className="text-xs text-gray-400 mt-0.5">Quản lý và theo dõi khách hàng tiềm năng</p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {filtered.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh */}
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => { dispatch(fetchAllLeads()); dispatch(fetchTodayLeads()); }}>
              Làm mới
            </Button>

            {/* Import */}
            <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" />
            <Button variant="outline" size="sm" leftIcon={<Upload className="w-3.5 h-3.5" />} onClick={handleImport}>
              Nhập Excel
            </Button>

            {/* Export */}
            <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={handleExport}>
              Xuất Excel
            </Button>

            {/* Bulk create */}
            <Button variant="outline" size="sm" leftIcon={<TableProperties className="w-3.5 h-3.5" />}
              onClick={() => navigate("/crm/leads/bulk-create")}>
              Tạo hàng loạt
            </Button>

            {/* Create */}
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => navigate("/crm/lead/create")}>
              Tạo Lead
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          {[
            { label: "Tất cả",    count: counts.all,       color: "bg-white border-gray-200",        text: "text-gray-700" },
            { label: "Mới",       count: counts.new,       color: "bg-white border-blue-100",        text: "text-blue-700" },
            { label: "Qualified", count: counts.qualified, color: "bg-white border-emerald-100",     text: "text-emerald-700" },
            { label: "Thua",      count: counts.lost,      color: "bg-white border-red-100",         text: "text-red-700" },
          ].map((c) => (
            <div key={c.label} className={`${c.color} border rounded-lg px-4 py-3`}>
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className={`text-base font-semibold mt-0.5 ${c.text}`}>{c.count}</p>
            </div>
          ))}
        </div>

        {/* Stage filter tabs + search */}
        <div className="px-5 pt-3 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="flex gap-0.5">
            {STAGE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStageFilter(tab.value)}
                className={[
                  "px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors border-b-2",
                  stageFilter === tab.value
                    ? "border-orange-500 text-orange-600 bg-orange-50/60"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative min-w-[200px] max-w-xs pb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full h-8 pl-8 pr-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="p-5">
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            searchable={false}
            showActions={true}
            onView={(lead) => navigate(`/crm/leads/${lead.id}`)}
            onDelete={(lead) => setDeleteTarget(lead)}
            canDelete={() => true}
            onRowClick={(lead) => navigate(`/crm/leads/${lead.id}`)}
            itemsPerPage={10}
          />
        </div>
      </div>

      {/* Delete confirmation */}
      <ActionConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xóa khách hàng tiềm năng"
        description={deleteTarget ? `Bạn có chắc chắn muốn xóa lead "${deleteTarget.name}"? Hành động này không thể hoàn tác.` : ""}
        confirmText="Xóa"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
