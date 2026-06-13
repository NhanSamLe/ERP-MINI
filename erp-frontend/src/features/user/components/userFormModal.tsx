import React, { useState, useEffect } from "react";
import { User, Role } from "../../../types/User";
import { createUserDTO, updateUserDTO } from "../dto/userDTO";
import { Branch } from "../../company/store";
import { X } from "lucide-react";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: createUserDTO) => void | Promise<void>;
  onUpdate: (data: updateUserDTO) => void | Promise<void>;
  editUser?: User | null;
  roles: Role[];
  branches: Branch[];
  error?: string | null;
}

export function UserFormModal({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  editUser,
  roles,
  branches,
  error,
}: UserFormModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    email: "",
    phone: "",
    role_id: roles.length > 0 ? roles[0].id : 1,
    branch_id: branches.length > 0 ? branches[0].id : 1,
  });
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      full_name: "",
      email: "",
      phone: "",
      role_id: roles.length > 0 ? roles[0].id : 1,
      branch_id: branches.length > 0 ? branches[0].id : 1,
    });
  };

  useEffect(() => {
    if (editUser) {
      setFormData({
        username: editUser.username,
        password: "",
        full_name: editUser.full_name || "",
        email: editUser.email || "",
        phone: editUser.phone || "",
        role_id: editUser.role?.id || 1,
        branch_id: editUser.branch?.id || 1,
      });
    } else {
      resetForm();
    }
  }, [editUser, roles, branches]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "role_id" || name === "branch_id" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (editUser) {
        await onUpdate({
          username: formData.username,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          role_id: formData.role_id,
          branch_id: formData.branch_id,
        });
      } else {
        await onCreate({
          username: formData.username,
          password: formData.password,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          role_id: formData.role_id,
          branch_id: formData.branch_id,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {editUser ? "Cập nhật người dùng" : "Thêm người dùng"}
          </h2>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Field label="Tên đăng nhập" required>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={!!editUser}
              required
              className="w-full h-9 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </Field>

          {!editUser && (
            <Field label="Mật khẩu" required>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full h-9 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </Field>
          )}

          <Field label="Họ tên">
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full h-9 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full h-9 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </Field>

          <Field label="Số điện thoại">
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full h-9 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </Field>

          <Field label="Vai trò" required>
            <select
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              className="w-full h-9 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Chi nhánh" required>
            <select
              name="branch_id"
              value={formData.branch_id}
              onChange={handleChange}
              className="w-full h-9 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="h-9 px-4 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 text-sm font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-9 px-4 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm font-medium disabled:opacity-60"
            >
              {submitting ? "Đang lưu..." : editUser ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
