"use client";

import { useState, useEffect } from "react";
import { BarChart3, PieChart, LineChart, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface ReportData {
  revenueByDay: { date: string; revenue: number }[];
  availableCourtsPercentage: number;
  bookingsThisWeek: number;
  courtDistribution: { INDOOR: number; OUTDOOR: number };
}

export default function StatsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data: ReportData = {
        revenueByDay: [
          { date: "2025-11-01", revenue: 4000000 },
          { date: "2025-11-02", revenue: 5000000 },
          { date: "2025-11-03", revenue: 4500000 },
          { date: "2025-11-04", revenue: 7000000 },
          { date: "2025-11-05", revenue: 6000000 },
          { date: "2025-11-06", revenue: 5500000 },
          { date: "2025-11-07", revenue: 6500000 },
        ],
        availableCourtsPercentage: 75,
        bookingsThisWeek: 150,
        courtDistribution: { INDOOR: 8, OUTDOOR: 4 },
      };
      setReport(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const currentMonthRevenue = () => {
    if (!report) return [];
    const now = new Date();
    const month = now.getMonth(); 
    const year = now.getFullYear();

    return report.revenueByDay.filter((item) => {
      const date = new Date(item.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });
  };

  const exportExcel = () => {
    const monthData = currentMonthRevenue().map((item) => ({
      Ngày: item.date,
      "Doanh thu": item.revenue,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthData), "DoanhThu_Thang");
    XLSX.writeFile(wb, "BaoCao_DoanhThu_ThangHienTai.xlsx");
  };

  if (loading || !report) return <p className="text-center py-10">Đang tải dữ liệu...</p>;

  const monthRevenue = currentMonthRevenue();
  const totalRevenue = monthRevenue.reduce((sum, m) => sum + m.revenue, 0);

  const revenueMonthChart = {
    labels: monthRevenue.map((m) => m.date),
    datasets: [
      {
        label: "Doanh Thu Ngày",
        data: monthRevenue.map((m) => m.revenue),
        backgroundColor: "rgba(251,191,36,0.7)",
      },
    ],
  };

  const courtDistData = {
    labels: ["INDOOR", "OUTDOOR"],
    datasets: [
      {
        label: "Số lượng sân",
        data: [report.courtDistribution.INDOOR, report.courtDistribution.OUTDOOR],
        backgroundColor: ["#3b82f6", "#10b981"],
      },
    ],
  };

  const chartOptions = { responsive: true, plugins: { legend: { display: false } } };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-8">Báo Cáo Tháng Hiện Tại</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold">Tổng Doanh Thu</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">{totalRevenue.toLocaleString()}đ</p>
          <p className="text-sm text-gray-600">Tháng này</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <PieChart className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold">Sân Trống</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">{report.availableCourtsPercentage}%</p>
          <p className="text-sm text-gray-600">Trung bình ngày</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <LineChart className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold">Đặt Sân Tuần Này</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">{report.bookingsThisWeek}</p>
          <p className="text-sm text-gray-600">Tuần này</p>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={exportExcel}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <FileDown className="w-4 h-4" />
          Xuất Excel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold mb-4">Doanh Thu Theo Ngày Trong Tháng</h3>
          <Bar data={revenueMonthChart} options={chartOptions} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold mb-4">Phân Bố Loại Sân</h3>
          <Pie data={courtDistData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
