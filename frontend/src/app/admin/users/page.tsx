

"use client";
import { User, Mail, Phone, Lock, Trash2, MapPinHouse } from "lucide-react";
import { useState, useEffect } from "react";

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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/users");
      if (!res.ok) throw new Error("Không thể tải danh sách người dùng");
      const data = await res.json();
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa người dùng này không?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/delete/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xóa thất bại");
      alert("Xóa người dùng thành công");
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };
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
                    <button className="text-blue-600 hover:text-blue-900">
                      <Lock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.userID)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    )}
  </div>
  );
}