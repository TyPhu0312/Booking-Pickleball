"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Court {
  courtID: string;
  name: string;
  type: string;
  status: string;
  image?: string;
}

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    status: "",
    image: "",
  });
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);

  // Lấy danh sách sân
  const fetchCourts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/courts");
      const data = await res.json();
      setCourts(data);
    } catch (error) {
      console.error("Lỗi khi tải sân:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  // ➕ Tạo sân mới
  const handleCreateCourt = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/courts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Lỗi khi tạo sân");
      setShowForm(false);
      setFormData({ name: "", type: "", status: "", image: "" });
      fetchCourts();
    } catch (error) {
      console.error(error);
    }
  };

  // ✏️ Cập nhật sân
  const handleUpdateCourt = async () => {
    if (!editingCourt) return;
    try {
      const res = await fetch(`http://localhost:5000/api/courts/update/${editingCourt.courtID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCourt),
      });
      if (!res.ok) throw new Error("Lỗi khi cập nhật sân");
      setEditingCourt(null);
      fetchCourts();
    } catch (error) {
      console.error(error);
    }
  };


  // 🗑️ Xóa sân
  const handleDeleteCourt = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sân này?")) return;
    try {
      await fetch(`http://localhost:5000/api/courts/delete/${id}`, {
        method: "DELETE",
      });
      fetchCourts();
    } catch (error) {
      console.error("Lỗi khi xóa sân:", error);
    }
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quản Lý Sân</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Thêm Sân
        </button>
      </div>

      {/* Bảng danh sách sân */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên Sân</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {courts.map((court) => (
              <tr key={court.courtID} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">{court.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {court.type === "INDOOR" ? "Trong nhà" : "Ngoài trời"}
                
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${court.status === "AVAILABLE"
                        ? "bg-green-100 text-green-800"
                        : court.status === "OCCUPIED"
                          ? "bg-yellow-100 text-yellow-800"
                          : court.status === "MAINTENANCE"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {court.status === "AVAILABLE" ? "Hoạt động" : court.status === "OCCUPIED" ? "Đang sử dụng" : court.status === "MAINTENANCE" ? "Bảo trì" : "Đóng cửa"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button className="text-blue-600 hover:text-blue-900"
                  onClick={() => setEditingCourt(court)}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCourt(court.courtID)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form thêm sân */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[400px] shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Thêm Sân Mới</h2>
            <input
              type="text"
              placeholder="Tên sân"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border p-2 rounded mb-3"
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full border p-2 rounded mb-3"
            >
              <option value="">Chọn loại sân</option>
              <option value="INDOOR">Trong nhà</option>
              <option value="OUTDOOR">Ngoài trời</option>

            </select>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full border p-2 rounded mb-3"
            >
               <option value="">Chọn trạng thái</option>
              <option value="AVAILABLE">Hoạt động</option>
              <option value="OCCUPIED">Đang sử dụng</option>
              <option value="MAINTENANCE">Bảo trì</option>
              <option value="CLOSED">Đóng cửa</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateCourt}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCourt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[400px] shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Chỉnh Sửa Sân</h2>
            <input
              type="text"
              placeholder="Tên sân"
              value={editingCourt.name}
              onChange={(e) =>
                setEditingCourt({ ...editingCourt, name: e.target.value })
              }
              className="w-full border p-2 rounded mb-3"
            />
            <select
              value={editingCourt.type}
              onChange={(e) =>
                setEditingCourt({ ...editingCourt, type: e.target.value })
              }
              className="w-full border p-2 rounded mb-3"
            >
              <option value="">Chọn loại sân</option>
              <option value="INDOOR">Trong nhà</option>
              <option value="OUTDOOR">Ngoài trời</option>
            </select>
            <select
              value={editingCourt.status}
              onChange={(e) =>
                setEditingCourt({ ...editingCourt, status: e.target.value })
              }
              className="w-full border p-2 rounded mb-3"
            >
              <option value="">Chọn trạng thái</option>
              <option value="AVAILABLE">Hoạt động</option>
              <option value="OCCUPIED">Đang sử dụng</option>
              <option value="MAINTENANCE">Bảo trì</option>
              <option value="CLOSED">Đóng cửa</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingCourt(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateCourt}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
