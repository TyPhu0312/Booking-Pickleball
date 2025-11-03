// app/admin/page.tsx
"use client";

import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
} from "lucide-react";

const stats = [
  {
    title: "Tổng Đặt Sân Hôm Nay",
    value: "25",
    icon: Calendar,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Doanh Thu Tháng",
    value: "45.000.000đ",
    icon: DollarSign,
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Người Dùng Mới",
    value: "12",
    icon: Users,
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "Tỷ Lệ Sân Trống",
    value: "75%",
    icon: Activity,
    color: "bg-orange-100 text-orange-600",
  },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      {/* Tiêu đề */}
      <h1 className="text-3xl font-bold text-slate-800 mb-8">
        👋 Xin chào, Admin
      </h1>

      {/* Thống kê chính */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-md border border-slate-200 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg ${stat.color} shadow-inner flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Biểu đồ doanh thu */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-md border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Doanh Thu Theo Tháng
            </h3>
            <button className="text-sm text-cyan-600 hover:underline">
              Xem chi tiết
            </button>
          </div>

          <div className="h-64 flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 rounded-lg border border-dashed border-slate-300">
            <p className="text-gray-500 text-sm">
              Biểu đồ doanh thu (Chart.js sắp ra mắt)
            </p>
          </div>
        </div>

        {/* Biểu đồ sân trống */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-md border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Sân Trống Theo Giờ
            </h3>
            <button className="text-sm text-cyan-600 hover:underline">
              Chi tiết
            </button>
          </div>
          <div className="h-64 flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 rounded-lg border border-dashed border-slate-300">
            <p className="text-gray-500 text-sm">
              Biểu đồ sân trống (Chart.js sắp ra mắt)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
