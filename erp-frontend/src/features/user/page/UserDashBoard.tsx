import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/store";
import {
  fetchAllUsers,
  fetchAllRoles,
  createUserThunk,
  updateUserThunk,
  deleteUserThunk,
} from "../store";
import { setError } from "../store/user.slice";

import { User } from "../../../types/User";
import { createUserDTO, updateUserDTO } from "../dto/userDTO";
import { Column } from "../../../types/common";
import { DataTable } from "../../../components/ui/DataTable";
import { UserFormModal } from "../components/userFormModal";
import {
  Download,
  Upload,
  RefreshCw,
  Settings,
  Plus,
} from "lucide-react";
// import { fetchAllBranchesThunk } from "../../company/store";

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
    // dispatch(fetchAllBranchesThunk());
  }, [dispatch]);

  const handleCreate = async (data: createUserDTO) => {
    dispatch(setError(null));

    const resultAction = await dispatch(createUserThunk(data));

    if (createUserThunk.rejected.match(resultAction)) {
      // Có lỗi -> không đóng modal
      return;
    }

    setIsModalOpen(false);
  };

  const handleUpdate = async (data: updateUserDTO) => {
    dispatch(setError(null));
    const resultAction = await dispatch(updateUserThunk(data));

    if (updateUserThunk.rejected.match(resultAction)) {
      return;
    }

    setIsModalOpen(false);
    setEditUser(null);
  };

  const handleDelete = async (id: number) => {
  const user = users.find((u) => u.id === id);
  if (
    user &&
    window.confirm(
      `Are you sure you want to delete ${user.full_name || user.username}?`
    )
  ) {
    const resultAction = await dispatch(deleteUserThunk(user.id));

    if (deleteUserThunk.rejected.match(resultAction)) {
      // BE trả lỗi (vd: đang liên kết dữ liệu, hoặc tự xóa chính mình)
      alert(resultAction.payload as string);
      return;
    }

    // Thành công thì không cần làm gì thêm, reducer đã filter rồi
  }
};


  // KHÔNG tạo cột actions nữa
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
              <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg">
                <Upload className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg">
                <Settings className="w-5 h-5" />
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
            // ⭐ BẮT BUỘC: cho phép edit/delete
            canEdit={() => true}
            canDelete={() => true}
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
