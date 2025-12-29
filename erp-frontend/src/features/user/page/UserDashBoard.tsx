import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import { requestPasswordReset } from "../../auth/auth.service"
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
import {
  Download,
  RefreshCw,
  Plus,
  KeyRound,
} from "lucide-react";
import Swal from "sweetalert2";

export default function UserDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { users, roles, loading, error } = useSelector(
    (state: RootState) => state.user
  );
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
    toast.success("Tạo người dùng thành công. Email kích hoạt đã được gửi ");
    setIsModalOpen(false);
  };

  const handleUpdate = async (data: updateUserDTO) => {
    dispatch(setError(null));
    const resultAction = await dispatch(updateUserThunk(data));

    if (updateUserThunk.rejected.match(resultAction)) {
      toast.error(resultAction.payload as string);
      return;
    }
    toast.success("Cập nhật người dùng thành công");
    setIsModalOpen(false);
    setEditUser(null);
  };

  const handleResetPassword = async (user: User) => {
    if (!user.email) {
      toast.error("Người dùng chưa có email");
      return;
    }

    if (!user.is_active) {
      toast.error("Tài khoản chưa được kích hoạt");
      return;
    }

    const confirmed = await confirmAction(
      "Gửi email đặt lại mật khẩu?",
      `Bạn có chắc muốn gửi email đặt lại mật khẩu cho ${
        user.full_name || user.username
      } không?`
    );
    if (!confirmed) return;

    try {
      await requestPasswordReset(user.username);
      toast.success("Đã gửi email đặt lại mật khẩu 📧");
    } catch (err) {
      let message = "Gửi email đặt lại mật khẩu thất bại";
      if (err instanceof Error) {
        message = err.message;
      }
      toast.error(message);
    }
  };

  // ✅ Hàm toggle status - ĐẶT Ở ĐÂY (ngoài handleDelete)
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

    toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản thành công`);
  };

  const handleDelete = async (id: number) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    const result = await Swal.fire({
      title: "Xóa người dùng?",
      text: `Bạn có chắc muốn xóa ${
        user.full_name || user.username
      } không? Hành động này không thể hoàn tác.`,
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

    toast.success("Xóa người dùng thành công");
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
        {
          header: "Tên đăng nhập",
          key: "username",
          width: 20,
        },
        {
          header: "Họ tên",
          key: "full_name",
          width: 25,
        },
        {
          header: "Email",
          key: "email",
          width: 30,
        },
        {
          header: "Số điện thoại",
          key: "phone",
          width: 15,
        },
        {
          header: "Vai trò",
          key: "id",
          width: 20,
          formatter: (_, row) => row.role?.name ?? "—",
        },
        {
          header: "Chi nhánh",
          key: "id",
          width: 25,
          formatter: (_, row) => row.branch?.name ?? "—",
        },
        {
          header: "Trạng thái",
          key: "is_active",
          width: 15,
          align: "center",
          formatter: (value) => (value ? "Hoạt động" : "Ngưng"),
        },
      ],
      data: users,
      fileName: "Danh_sach_tai_khoan.xlsx",
    });
  };

  const columns: Column<User>[] = [
    {
      key: "full_name",
      label: "User Name",
      sortable: true,
      render: (user) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
            {user.full_name?.charAt(0) || user.username.charAt(0)}
          </div>
          <span className="font-medium">
            {user.full_name || user.username}
          </span>
        </div>
      ),
    },
    { key: "phone", label: "Phone", sortable: true },
    { key: "email", label: "Email", sortable: true },
    {
      key: "role",
      label: "Role",
      render: (user) => user.role?.name || "—",
    },
    {
      key: "is_active",
      label: "Status",
      render: (user) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.is_active
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
              user.is_active ? "bg-green-600" : "bg-gray-500"
            }`}
          ></span>
          {user.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your users
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => dispatch(fetchAllUsers())}
                className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={exportUserReport}
                className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  dispatch(setError(null));
                  setEditUser(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                <Plus className="w-5 h-5" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* TABLE */}
          <DataTable
            data={users || []}
            columns={columns}
            loading={loading}
            searchable
            searchKeys={["full_name", "email", "phone"]}
            itemsPerPage={10}
            showSelection={false}
            showActions={true}
            onEdit={(user) => {
              setEditUser(user);
              setIsModalOpen(true);
            }}
            onDelete={(user) => handleDelete(user.id)}
            canEdit={() => true}
            canDelete={() => true}
            extraActions={(user) => (
              <>
                {/* Nút toggle status */}
                <button
                  onClick={() => handleToggleStatus(user)}
                  title={user.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                  className={`ml-2 ${
                    user.is_active
                      ? "text-gray-600 hover:text-gray-800"
                      : "text-green-600 hover:text-green-800"
                  }`}
                >
                  {user.is_active ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </button>

                {/* Nút reset password */}
                {user.is_active && user.email && (
                  <button
                    onClick={() => handleResetPassword(user)}
                    title="Send reset password email"
                    className="text-blue-600 hover:text-blue-800 ml-2"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          />
        </div>
      </div>

      {/* MODAL */}
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