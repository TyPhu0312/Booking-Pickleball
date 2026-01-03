

"use client";
import { User, Mail, Phone, Lock, Trash2, MapPinHouse, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";
import { set } from "date-fns";

interface User {
  userID: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  bank_account_number: string;
  bank_account_owner: string;
  bank_name: string;
  role: {roleID: string; name: string;};
}

interface Role {
  roleID: string;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [myid, setMyid] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [roles, setRoles] = useState<Role[]>([]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/users");
      if (!res.ok) throw new Error("Không thể tải danh sách người dùng");
      const data = await res.json();
      setUsers(data || []);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_URL}/api/roles`);
      if (!res.ok) throw new Error("Không thể tải danh sách vai trò");
      const data = await res.json();
      setRoles(data || []);
    } catch (err: unknown) {
      console.error((err as Error).message);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const roleName = typeof user.role === 'string' ? user.role : user.role?.name;
        setCurrentUserRole(roleName || "");
        setMyid(user.userID);
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);


  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleUpdateRole = async () => {
    if (!selectedUser || !selectedRoleId) {
      toast.error("Vui lòng chọn vai trò");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/users/updateRole/${selectedUser.userID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: selectedRoleId, userID: myid }),
      });

      if (!res.ok) throw new Error("Cập nhật vai trò thất bại");
      
      toast.success("Cập nhật vai trò thành công");
      setShowRoleDialog(false);
      setSelectedUser(null);
      setSelectedRoleId("");
      fetchUsers();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  // const handleDelete = async (id: string) => {
  //   if (!confirm("Bạn có chắc muốn xóa người dùng này không?")) return;
  //   try {
  //     const res = await fetch(`${API_URL}/api/users/delete/${id}`, { method: "DELETE" });
  //     if (!res.ok) throw new Error("Xóa thất bại");
  //     alert("Xóa người dùng thành công");
  //     fetchUsers();
  //   } catch (err: unknown) {
  //     alert((err as Error).message);
  //   }
  // };
  return (
    <div>
    <h1 className="text-3xl font-bold mb-8">Quản Lý Người Dùng</h1>

    {loading ? (
      <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
    ) : error ? (
      <div className="text-center py-10 text-red-500">{error}</div>
    ) : (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SĐT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đại chỉ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai Trò</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  Không có người dùng nào
                </td>
              </tr>
            ) : (
              users
              .filter((user) => user.role.name !== "superadmin")
              .map((user) => (
                <tr key={user.userID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {user.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {user.phone || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <MapPinHouse className="w-4 h-4" />
                      {user.address || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        user.role.name === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    {currentUserRole === "superadmin" && (
                      <button 
                        onClick={() => {
                          setSelectedUser(user);
                          setSelectedRoleId(user.role.roleID);
                          setShowRoleDialog(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Chỉnh sửa vai trò"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <button className="text-blue-600 hover:text-blue-900">
                      <Lock className="w-4 h-4" />
                    </button>
                    {/* <button
                      onClick={() => handleDelete(user.userID)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button> */}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    )}

    {showRoleDialog && (
      <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 relative">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Phân Quyền</h2>
          <p className="text-sm text-gray-600 mb-4">Người dùng: {selectedUser?.full_name}</p>
          
          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Vai trò *
            </label>
            <select
              id="role"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn vai trò</option>
              {roles
                .filter(role => role.name !== "superadmin")
                .map((role) => (
                  <option key={role.roleID} value={role.roleID}>
                    {role.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowRoleDialog(false);
                setSelectedUser(null);
                setSelectedRoleId("");
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
  </div>
  );
}