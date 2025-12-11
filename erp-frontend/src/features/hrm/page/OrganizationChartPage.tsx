import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { organizationApi } from "../api/organization.api";
import {
  OrganizationChartDTO,
  OrgDepartmentDTO,
  OrgPositionDTO,
} from "../dto/organization.dto";
import { BranchAPI } from "../../company/api/branch.api";
import { 
  Building2, 
  Users, 
  Briefcase, 
  ChevronDown,
  Search,
  Filter,
  Download,
  Maximize2,
  User,
} from "lucide-react";

export default function OrganizationChartPage() {
  const auth = useSelector((state: RootState) => state.auth.user);

  const roleCode = auth?.role?.code;
  const userBranchId = auth?.branch?.id;
  const isCEO = roleCode === "CEO";
  const isBranchManager = roleCode === "BRANCH_MANAGER";

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  const [data, setData] = useState<OrganizationChartDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "hierarchy">("hierarchy");

  useEffect(() => {
    const init = async () => {
      if (isCEO) {
        const res = await BranchAPI.list().then(r => r.data);
        setBranches(res);
        if (res.length > 0) {
          setSelectedBranchId(res[0].id);
        }
      } else if (isBranchManager && userBranchId) {
        setSelectedBranchId(userBranchId);
      }
    };
    init();
  }, [isCEO, isBranchManager, userBranchId]);

  useEffect(() => {
    if (!selectedBranchId) return;

    const load = async () => {
      try {
        setLoading(true);
        const param = selectedBranchId;
        const res = await organizationApi.getChart(param);
        setData(res);
        // Mở tất cả departments mặc định
        if (res?.departments) {
          setExpandedDepts(new Set(res.departments.map(d => d.id)));
        }
      } catch (err) {
        console.error("❌ Failed to load organization chart", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedBranchId]);

  const toggleDept = (deptId: number) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepts(newExpanded);
  };

  const getTotalEmployees = () => {
    if (!data) return 0;
    return data.departments.reduce((acc, dept) => {
      return acc + dept.positions.reduce((posAcc, pos) => {
        return posAcc + pos.employees.length;
      }, 0);
    }, 0);
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      'ACTIVE': 'bg-green-100 text-green-700 border-green-200',
      'INACTIVE': 'bg-gray-100 text-gray-600 border-gray-200',
      'ON_LEAVE': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  if (!isCEO && !isBranchManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quyền truy cập bị hạn chế</h2>
          <p className="text-gray-600">Bạn không có quyền xem cơ cấu tổ chức. Vui lòng liên hệ quản trị viên.</p>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải cơ cấu tổ chức...</p>
        </div>
      </div>
    );
  }

  const filteredDepartments = data.departments.filter(dept => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      dept.name.toLowerCase().includes(search) ||
      dept.code.toLowerCase().includes(search) ||
      dept.positions.some(pos => 
        pos.name.toLowerCase().includes(search) ||
        pos.employees.some(emp => 
          emp.full_name.toLowerCase().includes(search) ||
          emp.emp_code.toLowerCase().includes(search)
        )
      )
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sơ đồ tổ chức</h1>
                <p className="text-sm text-gray-500">{data.branch.name} ({data.branch.code})</p>
              </div>
            </div>

            {isCEO && (
              <div className="relative">
                <select
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer shadow-sm"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Phòng ban</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{data.departments.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Chức danh</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {data.departments.reduce((acc, d) => acc + d.positions.length, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Nhân viên</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{getTotalEmployees()}</p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm phòng ban, chức danh, nhân viên..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                onClick={() => setViewMode(viewMode === "grid" ? "hierarchy" : "grid")}
                className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Maximize2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {filteredDepartments.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">
              {searchTerm ? "Không tìm thấy kết quả phù hợp" : "Chi nhánh chưa có phòng ban"}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {filteredDepartments.map((dept: OrgDepartmentDTO) => {
            const isExpanded = expandedDepts.has(dept.id);
            const totalEmployees = dept.positions.reduce((acc, pos) => acc + pos.employees.length, 0);

            return (
              <div
                key={dept.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all hover:shadow-xl"
              >
                {/* Department Header */}
                <div
                  className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all"
                  onClick={() => toggleDept(dept.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h2 className="text-xl font-bold text-white">{dept.name}</h2>
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                            {dept.code}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-blue-100 text-sm">
                          <span className="flex items-center space-x-1">
                            <Briefcase className="w-4 h-4" />
                            <span>{dept.positions.length} chức danh</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{totalEmployees} nhân viên</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-6 h-6 text-white transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Department Content */}
                {isExpanded && (
                  <div className="p-6">
                    {dept.positions.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Chưa có chức danh trong phòng ban này</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {dept.positions.map((pos: OrgPositionDTO) => (
                          <div
                            key={pos.id + "-" + pos.name}
                            className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all bg-gradient-to-br from-white to-gray-50"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                                  <Briefcase className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">{pos.name}</h3>
                                  <p className="text-xs text-gray-500">
                                    {pos.employees.length} người
                                  </p>
                                </div>
                              </div>
                            </div>

                            {pos.employees.length === 0 ? (
                              <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-xs text-gray-500">Chưa có nhân viên</p>
                              </div>
                            ) : (
                              <div className="grid md:grid-cols-2 gap-3">
                                {pos.employees.map((e) => (
                                  <div
                                    key={e.id}
                                    className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
                                  >
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                                      <span className="text-white font-semibold text-sm">
                                        {e.full_name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                        {e.full_name}
                                      </p>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-500">{e.emp_code}</span>
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(
                                            e.status
                                          )}`}
                                        >
                                          {e.status}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}