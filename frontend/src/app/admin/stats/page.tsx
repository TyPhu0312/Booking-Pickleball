/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { BarChart3, PieChart, LineChart, FileDown, TrendingUp, Users, CalendarCheck, DollarSign } from "lucide-react";
import { toast } from "sonner";
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
  LineElement,
  PointElement,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from "date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);
import { API_URL } from '@/lib/config';

interface Booking {
  bookingID: string;
  total_price: number;
  status: string;
  booking_date: string;
  createdAt: string;
  court?: {
    type: string;
  };
}

interface Court {
  courtID: string;
  type: string;
  status: string;
}

interface StatsData {
  totalRevenue: number;
  grossRevenue: number;
  refundsPaid: number;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  revenueByDay: { date: string; gross: number; refundsPaid: number; net: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  bookingsByStatus: { status: string; count: number }[];
  courtDistribution: { INDOOR: number; OUTDOOR: number };
  availableCourts: number;
  totalCourts: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  useEffect(() => {
    fetchStats();
  }, [selectedMonth]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [bookingsRes, courtsRes, refundsRes] = await Promise.all([
        fetch(`${API_URL}/api/bookings`),
        fetch(`${API_URL}/api/courts`),
        fetch(`${API_URL}/api/refunds/admin/requests`),
      ]);

      if (!bookingsRes.ok || !courtsRes.ok) {
        throw new Error("Không thể tải dữ liệu");
      }

      const bookings: Booking[] = await bookingsRes.json();
      const courts: Court[] = await courtsRes.json();
      const refundsData: any[] = refundsRes.ok ? await refundsRes.json() : [];

      const refundsByBooking: Record<string, { refundToCustomer: number; paidTotal: number; retained: number; hasRefund: boolean }> = {};
      refundsData.forEach((p) => {
        const bookingId = p.booking_id;
        if (!bookingId) return;
        const paid = Number(p.paid_amount || 0);
        const refund = Number(p.refund_amount || 0);
        const status = p.refund_status;

        const consideredRefund = status === "COMPLETED" ? refund : 0;

        if (!refundsByBooking[bookingId]) {
          refundsByBooking[bookingId] = { refundToCustomer: consideredRefund, paidTotal: paid, retained: Math.max(paid - refund, 0), hasRefund: !!p.refund_amount };
        } else {
          refundsByBooking[bookingId].refundToCustomer += consideredRefund;
          refundsByBooking[bookingId].paidTotal += paid;
          refundsByBooking[bookingId].retained += Math.max(paid - refund, 0);
          refundsByBooking[bookingId].hasRefund = refundsByBooking[bookingId].hasRefund || !!p.refund_amount;
        }
      });

      const currentMonthStart = startOfMonth(new Date(selectedMonth));
      const currentMonthEnd = endOfMonth(new Date(selectedMonth));

      const monthBookings = bookings.filter((b) => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= currentMonthStart && bookingDate <= currentMonthEnd;
      });

      const daysInMonth = eachDayOfInterval({
        start: currentMonthStart,
        end: currentMonthEnd,
      });

      const revenueByDay = daysInMonth.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayBookings = monthBookings.filter(
          (b) => format(new Date(b.createdAt), "yyyy-MM-dd") === dayStr
        );

        let dayGross = 0;
        dayBookings.forEach((booking: any) => {
          if (booking.status === "CONFIRMED" || booking.status === "COMPLETED" || booking.status === "CHECKED_IN") {
            dayGross += Number(booking.deposit_amount || 0);
          }
          
          if (booking.payments && Array.isArray(booking.payments)) {
            booking.payments.forEach((payment: any) => {
              const paymentDate = new Date(payment.payment_date || payment.createdAt);
              const isInDay = format(paymentDate, "yyyy-MM-dd") === dayStr;
              
              if ((payment.status === "PAID" || payment.status === "PARTIALLY_PAID") && isInDay) {
                dayGross += Number(payment.paid_amount) || Number(payment.amount) || 0;
              }
            });
          }
        });

        const dayRefundsPaid = refundsData.reduce((acc, p) => {
          if (!p.booking_id) return acc;
          if (p.refund_status !== "COMPLETED") return acc;
          const refundDate = new Date(p.updatedAt);
          const isInDay = format(refundDate, "yyyy-MM-dd") === dayStr;
          if (!isInDay) return acc;
          return acc + Number(p.refund_amount || 0);
        }, 0);

        const dayNet = dayGross - dayRefundsPaid;

        return { date: dayStr, gross: dayGross, refundsPaid: dayRefundsPaid, net: dayNet };
      });

      const revenueByMonth = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const monthStr = format(monthDate, "yyyy-MM");

        const monthBookingsData = bookings.filter((b) => {
          const bookingDate = new Date(b.createdAt);
          return bookingDate >= monthStart && bookingDate <= monthEnd;
        });

        let monthGross = 0;
        monthBookingsData.forEach((booking: any) => {
          if (booking.status === "CONFIRMED" || booking.status === "COMPLETED" || booking.status === "CHECKED_IN") {
            monthGross += Number(booking.deposit_amount || 0);
          }
          
          if (booking.payments && Array.isArray(booking.payments)) {
            booking.payments.forEach((payment: any) => {
              const paymentDate = new Date(payment.payment_date || payment.createdAt);
              const isInMonth = paymentDate >= monthStart && paymentDate <= monthEnd;
              
              if ((payment.status === "PAID" || payment.status === "PARTIALLY_PAID") && isInMonth) {
                monthGross += Number(payment.paid_amount) || Number(payment.amount) || 0;
              }
            });
          }
        });

        const monthRefundsPaid = refundsData.reduce((acc, p) => {
          if (!p.booking_id) return acc;
          if (p.refund_status !== "COMPLETED") return acc;
          const refundDate = new Date(p.updatedAt);
          const isInMonth = refundDate >= monthStart && refundDate <= monthEnd;
          if (!isInMonth) return acc;
          return acc + Number(p.refund_amount || 0);
        }, 0);

        const monthNet = monthGross - monthRefundsPaid;

        revenueByMonth.push({ month: monthStr, revenue: monthNet });
      }

      const statusCount = monthBookings.reduce((acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const bookingsByStatus = Object.entries(statusCount).map(([status, count]) => ({
        status,
        count,
      }));

      const courtsByType = courts.reduce(
        (acc, c) => {
          if (c.type === "INDOOR" || c.type === "OUTDOOR") {
            acc[c.type]++;
          }
          return acc;
        },
        { INDOOR: 0, OUTDOOR: 0 }
      );

      const availableCourts = courts.filter((c) => c.status === "AVAILABLE").length;

      let grossRevenue = 0;
      monthBookings.forEach((booking: any) => {
        if (booking.status === "CONFIRMED" || booking.status === "COMPLETED" || booking.status === "CHECKED_IN") {
          grossRevenue += Number(booking.deposit_amount || 0);
        }
        
        if (booking.payments && Array.isArray(booking.payments)) {
          booking.payments.forEach((payment: any) => {
            const paymentDate = new Date(payment.payment_date || payment.createdAt);
            const isInMonth = paymentDate >= currentMonthStart && paymentDate <= currentMonthEnd;
            
            if ((payment.status === "PAID" || payment.status === "PARTIALLY_PAID") && isInMonth) {
              grossRevenue += Number(payment.paid_amount) || Number(payment.amount) || 0;
            }
          });
        }
      });

      const refundsPaid = refundsData.reduce((acc, p) => {
        if (!p.booking_id) return acc;
        if (p.refund_status !== "COMPLETED") return acc;
        const refundDate = new Date(p.updatedAt);
        const isInMonth = refundDate >= currentMonthStart && refundDate <= currentMonthEnd;
        if (!isInMonth) return acc;
        return acc + Number(p.refund_amount || 0);
      }, 0);

      const totalRevenue = grossRevenue - refundsPaid;

      setStats({
        totalRevenue,
        grossRevenue,
        refundsPaid,
        totalBookings: monthBookings.length,
        completedBookings: monthBookings.filter((b) => b.status === "COMPLETED").length,
        pendingBookings: monthBookings.filter((b) => b.status === "PENDING").length,
        cancelledBookings: monthBookings.filter((b) => b.status === "CANCELLED").length,
        revenueByDay,
        revenueByMonth,
        bookingsByStatus,
        courtDistribution: courtsByType,
        availableCourts,
        totalCourts: courts.length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Không thể tải dữ liệu thống kê");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!stats) return;

    const revenueData = stats.revenueByDay.map((item) => ({
      Ngày: format(new Date(item.date), "dd/MM/yyyy"),
      "Doanh thu ròng (VNĐ)": item.net,
      "Tiền đã hoàn trả (VNĐ)": item.refundsPaid || 0,
    }));

    const summaryData = [
      { "Chỉ số": "Doanh thu gộp", "Giá trị": (stats as any).grossRevenue || 0 },
      { "Chỉ số": "Tiền đã trả khách", "Giá trị": (stats as any).refundsPaid || 0 },
      { "Chỉ số": "Doanh thu ròng", "Giá trị": stats.totalRevenue },
      { "Chỉ số": "Tổng đặt sân", "Giá trị": stats.totalBookings },
      { "Chỉ số": "Đã hoàn thành", "Giá trị": stats.completedBookings },
      { "Chỉ số": "Đang chờ", "Giá trị": stats.pendingBookings },
      { "Chỉ số": "Đã hủy", "Giá trị": stats.cancelledBookings },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Tổng quan");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(revenueData), "Doanh thu theo ngày");
    XLSX.writeFile(wb, `BaoCao_ThongKe_${selectedMonth}.xlsx`);
    toast.success("Xuất Excel thành công!");
  };

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const availablePercentage = stats.totalCourts > 0 
    ? Math.round((stats.availableCourts / stats.totalCourts) * 100) 
    : 0;

  const revenueChartData = {
    labels: stats.revenueByDay.map((item) => format(new Date(item.date), "dd/MM")),
    datasets: [
      {
        label: "Doanh thu ròng (VNĐ)",
        data: stats.revenueByDay.map((item) => item.net),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  const refundsChartData = {
    labels: stats.revenueByDay.map((item) => format(new Date(item.date), "dd/MM")),
    datasets: [
      {
        label: "Tiền đã hoàn (VNĐ)",
        data: stats.revenueByDay.map((item) => item.refundsPaid),
        backgroundColor: "rgba(239, 68, 68, 0.6)",
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 1,
      },
    ],
  };

  const monthRevenueChartData = {
    labels: stats.revenueByMonth.map((item) => format(new Date(item.month), "MM/yyyy")),
    datasets: [
      {
        label: "Doanh thu (VNĐ)",
        data: stats.revenueByMonth.map((item) => item.revenue),
        borderColor: "rgba(16, 185, 129, 1)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const courtDistData = {
    labels: ["Sân trong nhà", "Sân ngoài trời"],
    datasets: [
      {
        data: [stats.courtDistribution.INDOOR, stats.courtDistribution.OUTDOOR],
        backgroundColor: ["#3b82f6", "#10b981"],
        borderColor: ["#2563eb", "#059669"],
        borderWidth: 2,
      },
    ],
  };

  const statusDistData = {
    labels: stats.bookingsByStatus.map((item) => {
      const statusLabels: Record<string, string> = {
        COMPLETED: "Hoàn thành",
        CONFIRMED: "Đã xác nhận",
        PENDING: "Chờ xử lý",
        CANCELLED: "Đã hủy",
        CHECKED_IN: "Đã check-in",
        CANCEL_REQUESTED: "Yêu cầu hủy và hoàn tiền",
      };
      return statusLabels[item.status] || item.status;
    }),
    datasets: [
      {
        data: stats.bookingsByStatus.map((item) => item.count),
        backgroundColor: [
          "#10b981",
          "#3b82f6",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString() + " VNĐ";
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return value.toLocaleString() + " đ";
          },
        },
      },
    },
  };

  const refundsChartOptions = {
    ...chartOptions,
    maintainAspectRatio: false,
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return "Doanh thu: " + context.parsed.y.toLocaleString() + " VNĐ";
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return value.toLocaleString() + " đ";
          },
        },
      },
    },
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Báo Cáo & Thống Kê</h1>
        <div className="flex gap-3 items-center">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          />
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <FileDown className="w-4 h-4" />
            Xuất Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Tổng Doanh Thu</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalRevenue.toLocaleString()}đ</p>
          <p className="text-xs text-gray-500 mt-2">{format(new Date(selectedMonth), "MM/yyyy")}</p>
          <div className="mt-2 text-xs text-gray-600">
            <div>Doanh thu gộp: {(stats as any).grossRevenue?.toLocaleString?.() ?? 0}đ</div>
            <div>Tiền đã trả khách: {(stats as any).refundsPaid?.toLocaleString?.() ?? 0}đ</div>
            <div className="font-semibold">Doanh thu sau trừ hoàn: {stats.totalRevenue.toLocaleString()}đ</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CalendarCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Đặt Sân Hoàn Thành</p>
          <p className="text-2xl font-bold text-green-600">{stats.completedBookings}</p>
          <p className="text-xs text-gray-500 mt-2">
            Tổng: {stats.totalBookings} đặt sân
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Đang Chờ Xử Lý</p>
          <p className="text-2xl font-bold text-orange-600">{stats.pendingBookings}</p>
          <p className="text-xs text-gray-500 mt-2">
            Đã hủy: {stats.cancelledBookings}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Sân Có Sẵn</p>
          <p className="text-2xl font-bold text-purple-600">{availablePercentage}%</p>
          <p className="text-xs text-gray-500 mt-2">
            {stats.availableCourts}/{stats.totalCourts} sân
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Doanh Thu Theo Ngày
          </h3>
          <Bar data={revenueChartData} options={chartOptions} />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-green-600" />
            Xu Hướng 6 Tháng Gần Đây
          </h3>
          <Line data={monthRevenueChartData} options={lineChartOptions} />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            Phân Bố Loại Sân
          </h3>
          <div className="flex justify-center">
            <div className="w-64 h-64">
              <Pie data={courtDistData} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-orange-600" />
            Trạng Thái Đặt Sân
          </h3>
          <div className="flex justify-center">
            <div className="w-64 h-64">
              <Pie data={statusDistData} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
        <h3 className="font-semibold mb-4">Tiền đã hoàn theo ngày</h3>
        <div className="mb-4 h-40">
          <Bar data={refundsChartData} options={refundsChartOptions} />
        </div>
      </div>
    </div>
  );
}
