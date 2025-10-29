// app/admin/courts/page.tsx
import { Plus, Edit, Trash2 } from "lucide-react";

const courts = [
  { id: 1, name: "Sân A1", type: "Indoor", price: 250000, status: "active" },
  { id: 2, name: "Sân A2", type: "Indoor", price: 250000, status: "maintenance" },
  { id: 3, name: "Sân B1", type: "Outdoor", price: 200000, status: "active" },
];

export default function CourtsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quản Lý Sân</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Thêm Sân
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên Sân</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá/Giờ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {courts.map((court) => (
              <tr key={court.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">{court.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{court.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">{court.price.toLocaleString()}đ</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    court.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {court.status === "active" ? "Hoạt động" : "Bảo trì"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button className="text-blue-600 hover:text-blue-900">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}