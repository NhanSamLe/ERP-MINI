import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import { requestPasswordReset } from "../../auth/auth.service";
import { exportExcelReport } from "../../../utils/excel/exportExcelReport";
import {
  fetchAllUsers,
  fetchAllRoles,
  createUserThunk,
  updateUserThunk,
  deleteUserThunk,
} from "../store";
import { setError } from "../store/user.slice";
import { confirmAction } from "../../../utils/alert";
import { User } from "../../../types/User";
import { createUserDTO, updateUserDTO } from "../dto/userDTO";
import { Column } from "../../../types/common";
import { DataTable } from "../../../components/ui/DataTable";
import { UserFormModal } from "../components/userFormModal";
import { toast } from "react-toastify";
import { Download, RefreshCw, Plus, KeyRound, Users, Power } from "lucide-react";
import Swal from "sweetalert2";

export default function UserDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { users, roles, loading, error } = useSelector((state: RootState) => state.user);
  const { branches } = useSelector((state: RootState) => state.branch);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  useEffect(() => {
    dispatch(fetchAllUsers());
    dispatch(fetchAllRoles());
  }, [dispatch]);

  const handleCreate = async (data: createUserDTO) => {
    dispatch(setError(null));
    const resultAction = await dispatch(createUserThunk(data));

    if (createUserThunk.rejected.match(resultAction)) {
      toast.error(resultAction.payload as string);
      return;
    }
    toast.success("Tạo người dùng thành công. Email kích hoạt đã được gửi.");
    setIsModalOpen(false);
  };

  const handleUpdate = async (data: updateUserDTO) => {
    dispatch(setError(null));
    const resultAction = await dispatch(updateUserThunk(data));

    if (updateUserThunk.rejected.match(resultAction)) {
      toast.error(resultAction.payload as string);
      return;
    }
    toast.success("Cập nhật người dùng thành công.");
    setIsModalOpen(false);
    setEditUser(null);
  };

  const handleResetPassword = async (user: User) => {
    if (!user.email) {
      toast.error("Người dùng chưa có email.");
      return;
    }

    if (!user.is_active) {
      toast.error("Tài khoản chưa được kích hoạt.");
      return;
    }

    const confirmed = await confirmAction(
      "Gửi email đặt lại mật khẩu?",
      `Bạn có chắc muốn gửi email đặt lại mật khẩu cho ${user.full_name || user.username} không?`
    );
    if (!confirmed) return;

    try {
      await requestPasswordReset(user.username);
      toast.success("Đã gửi email đặt lại mật khẩu.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gửi email đặt lại mật khẩu thất bại.");
    }
  };

  const handleToggleStatus = async (user: User) => {
    const action = user.is_active ? "vô hiệu hóa" : "kích hoạt";
    const confirmed = await confirmAction(
      `${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản?`,
      `Bạn có chắc muốn ${action} tài khoản ${user.full_name || user.username} không?`
    );
    if (!confirmed) return;

    const updateData: updateUserDTO = {
      username: user.username,
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      role_id: user.role?.id || 1,
      branch_id: user.branch?.id || 1,
      is_active: !user.is_active,
    };

    const resultAction = await dispatch(updateUserThunk(updateData));

    if (updateUserThunk.rejected.match(resultAction)) {
      toast.error(resultAction.payload as string);
      return;
    }

    toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản thành công.`);
  };

  const handleDelete = async (id: number) => {
    const user = users.find((item) => item.id === id);
    if (!user) return;

    const result = await Swal.fire({
      title: "Xóa người dùng?",
      text: `Bạn có chắc muốn xóa ${user.full_name || user.username} không? Hành động này không thể hoàn tác.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    const resultAction = await dispatch(deleteUserThunk(user.id));

    if (deleteUserThunk.rejected.match(resultAction)) {
      toast.error(resultAction.payload as string);
      return;
    }

    toast.success("Xóa người dùng thành công.");
  };

  const exportUserReport = () => {
    exportExcelReport<User>({
      title: "DANH SÁCH TÀI KHOẢN NGƯỜI DÙNG",
      subtitle: "Hệ thống ERP",
      meta: {
        "Ngày xuất": new Date().toLocaleDateString("vi-VN"),
        "Tổng số": users.length.toString(),
      },
      columns: [
        { header: "Tên đăng nhập", key: "username", width: 20 },
        { header: "Họ tên", key: "full_name", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Số điện thoại", key: "phone", width: 15 },
        { header: "Vai trò", key: "id", width: 20, formatter: (_, row) => row.role?.name ?? "-" },
        { header: "Chi nhánh", key: "id", width: 25, formatter: (_, row) => row.branch?.name ?? "-" },
        {
          header: "Trạng thái",
          key: "is_active",
          width: 15,
          align: "center",
          formatter: (value) => (value ? "Hoạt động" : "Ngừng hoạt động"),
        },
      ],
      data: users,
      fileName: "Danh_sach_tai_khoan.xlsx",
    });
  };

  const columns: Column<User>[] = [
    {
      key: "full_name",
      label: "Người dùng",
      sortable: true,
      render: (user) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-sm font-semibold">
            {(user.full_name || user.username).charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-medium text-gray-900">{user.full_name || user.username}</span>
            <p className="text-xs text-gray-400">{user.username}</p>
          </div>
        </div>
      ),
    },
    { key: "phone", label: "Số điện thoại", sortable: true },
    { key: "email", label: "Email", sortable: true },
    {
      key: "role",
      label: "Vai trò",
      render: (user) => user.role?.name || "-",
    },
    {
      key: "branch",
      label: "Chi nhánh",
      render: (user) => user.branch?.name || "-",
    },
    {
      key: "is_active",
      label: "Trạng thái",
      render: (user) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-700"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.is_active ? "bg-emerald-600" : "bg-gray-500"}`} />
          {user.is_active ? "Hoạt động" : "Ngừng hoạt động"}
        </span>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="erp-card overflow-hidden">
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-gray-200 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-orange-500" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Người dùng</h1>
              <p className="text-xs text-gray-400 mt-0.5">Quản lý tài khoản, vai trò và chi nhánh truy cập hệ thống</p>
            </div>
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
              {users.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => dispatch(fetchAllUsers())}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
              title="Tải lại"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={exportUserReport}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất file
            </button>
            <button
              onClick={() => {
                dispatch(setError(null));
                setEditUser(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm người dùng
            </button>
          </div>
        </div>

        <div className="px-5 py-4">
          <DataTable
            data={users || []}
            columns={columns}
            loading={loading}
            searchable
            searchKeys={["full_name", "email", "phone"]}
            itemsPerPage={10}
            showSelection={false}
            showActions
            onEdit={(user) => {
              setEditUser(user);
              setIsModalOpen(true);
            }}
            onDelete={(user) => handleDelete(user.id)}
            canEdit={() => true}
            canDelete={() => true}
            extraActions={(user) => (
              <>
                <button
                  onClick={() => handleToggleStatus(user)}
                  title={user.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                    user.is_active
                      ? "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                      : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800"
                  }`}
                >
                  <Power className="w-4 h-4" />
                </button>

                {user.is_active && user.email && (
                  <button
                    onClick={() => handleResetPassword(user)}
                    title="Gửi email đặt lại mật khẩu"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          />
        </div>
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => {
          dispatch(setError(null));
          setIsModalOpen(false);
          setEditUser(null);
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        editUser={editUser}
        roles={roles || []}
        branches={branches || []}
        error={error}
      />
    </div>
  );
}
