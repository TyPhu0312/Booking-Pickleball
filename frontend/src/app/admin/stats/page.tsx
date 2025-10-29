// app/admin/stats/page.tsx
import { BarChart3, PieChart, LineChart } from "lucide-react";

export default function StatsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Thống Kê Hệ Thống</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold">Doanh Thu</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">45.000.000đ</p>
          <p className="text-sm text-gray-600">Tháng 10/2025</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <PieChart className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold">Sân Trống</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">75%</p>
          <p className="text-sm text-gray-600">Trung bình ngày</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <LineChart className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold">Đặt Sân</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">150</p>
          <p className="text-sm text-gray-600">Tuần này</p>
        </div>
      </div>

      {/* Biểu đồ chi tiết */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold mb-4">Doanh Thu Theo Ngày</h3>
          <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
            <p>Biểu đồ đường (kết nối Chart.js)</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold mb-4">Phân Bố Loại Sân</h3>
          <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
            <p>Biểu đồ tròn</p>
          </div>
        </div>
      </div>
    </div>
  );
}