// app/admin/bookings/page.tsx
import { Eye, Check, X } from "lucide-react";

const bookings = [
  { id: 1, user: "Nguyễn Văn A", date: "2025-10-30", slot: "19:00-20:00", status: "pending", total: 100000 },
  { id: 2, user: "Trần Thị B", date: "2025-10-31", slot: "15:00-16:00", status: "confirmed", total: 100000 },
  { id: 3, user: "Lê Văn C", date: "2025-11-01", slot: "20:00-21:00", status: "cancelled", total: 0 },
];

export default function BookingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Quản Lý Đặt Sân</h1>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người Dùng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slot</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng Thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng Tiền</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{booking.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{booking.user}</td>
                <td className="px-6 py-4 whitespace-nowrap">{booking.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">{booking.slot}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    booking.status === "confirmed" ? "bg-green-100 text-green-800" :
                    booking.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {booking.status === "confirmed" ? "Đã xác nhận" :
                     booking.status === "pending" ? "Chờ xác nhận" : "Đã hủy"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{booking.total.toLocaleString()}đ</td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button className="text-blue-600 hover:text-blue-900">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-900">
                    <Check className="w-4 h-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <X className="w-4 h-4" />
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