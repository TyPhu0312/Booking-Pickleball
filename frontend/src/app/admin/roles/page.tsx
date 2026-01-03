"use client";
import { Shield, Plus, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";

interface Role {
  roleID: string;
  name: string;
  description?: string;
}

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      const role = typeof user.role === "string" ? user.role : user.role?.name;
      if (role !== "superadmin") {
        toast.error("Bạn không có quyền truy cập trang này");
        router.push("/admin");
        return;
      }
    } else {
      toast.error("Vui lòng đăng nhập");
      router.push("/login");
      return;
    }
    fetchRoles();
  }, [router]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/roles`);
      if (!res.ok) throw new Error("Không thể tải danh sách vai trò");
      const data = await res.json();
      setRoles(data || []);
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên vai trò");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/roles/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Tạo vai trò thất bại");
      
      toast.success("Tạo vai trò thành công");
      setShowCreateModal(false);
      setFormData({ name: "", description: "" });
      fetchRoles();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole || !formData.name.trim()) {
      toast.error("Vui lòng nhập tên vai trò");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/roles/update/${selectedRole.roleID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Cập nhật vai trò thất bại");
      
      toast.success("Cập nhật vai trò thành công");
      setShowEditModal(false);
      setSelectedRole(null);
      setFormData({ name: "", description: "" });
      fetchRoles();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      const res = await fetch(`${API_URL}/api/roles/delete/${selectedRole.roleID}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Xóa vai trò thất bại");
      
      toast.success("Xóa vai trò thành công");
      setShowDeleteModal(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Vai Trò</h1>
          <p className="text-gray-600 mt-1">Quản lý các vai trò và quyền hạn trong hệ thống</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm Vai Trò
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div
              key={role.roleID}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    role.name === "superadmin" 
                      ? "bg-red-100 text-red-600"
                      : role.name === "admin"
                      ? "bg-purple-100 text-purple-600"
                      : "bg-blue-100 text-blue-600"
                  }`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg capitalize">{role.name}</h3>
                    {role.description && (
                      <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {role.name !== "superadmin" && (
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setFormData({ name: role.name, description: role.description || "" });
                      setShowEditModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Sửa
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setShowDeleteModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa
                  </button>
                </div>
              )}

              {role.name === "superadmin" && (
                <div className="mt-4 pt-4 border-t">
                  <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    Không thể chỉnh sửa
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Tạo Vai Trò Mới</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Tên vai trò *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: admin, user, manager..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả vai trò..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: "", description: "" });
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateRole}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Chỉnh Sửa Vai Trò</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Tên vai trò *
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedRole(null);
                  setFormData({ name: "", description: "" });
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateRole}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 relative">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Xác nhận xóa vai trò</h2>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa vai trò <span className="font-semibold">{selectedRole?.name}</span>? 
              Hành động này không thể hoàn tác.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRole(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteRole}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
