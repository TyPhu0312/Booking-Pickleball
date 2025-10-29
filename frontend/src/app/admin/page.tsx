// app/admin/page.tsx
import { Calendar, Users, DollarSign, TrendingUp, Activity } from "lucide-react";

const stats = [
  { title: "Tổng Đặt Sân Hôm Nay", value: "25", icon: Calendar, color: "blue" },
  { title: "Doanh Thu Tháng", value: "45.000.000đ", icon: DollarSign, color: "green" },
  { title: "Người Dùng Mới", value: "12", icon: Users, color: "purple" },
  { title: "Tỷ Lệ Sân Trống", value: "75%", icon: Activity, color: "orange" },
];

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Thống kê chính */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Biểu đồ (giả lập) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Doanh Thu Theo Tháng</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Biểu đồ doanh thu (sẽ kết nối Chart.js)</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Sân Trống Theo Giờ</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Biểu đồ sân trống</p>
          </div>
        </div>
      </div>
    </div>
  );
}