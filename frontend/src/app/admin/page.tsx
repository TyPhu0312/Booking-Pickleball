/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Trophy,
  MapPin,
  Clock,
} from "lucide-react";
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
import { Bar } from "react-chartjs-2";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import Link from "next/link";

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

interface DashboardStats {
  todayBookings: number;
  monthRevenue: number;
  newUsers: number;
  availableCourtsPercentage: number;
  totalCourts: number;
  activeTournaments: number;
  pendingBookings: number;
  todayRevenue: number;
}

interface RecentBooking {
  bookingID: string;
  booking_date: string;
  status: string;
  total_price: number;
  user: {
    full_name: string;
  };
  phone_user?: string;
  court: {
    name: string;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [hourlySlots, setHourlySlots] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, courtsRes, usersRes, tournamentsRes] = await Promise.all([
        fetch(`${API_URL}/api/bookings`),
        fetch(`${API_URL}/api/courts`),
        fetch(`${API_URL}/api/users`),
        fetch(`${API_URL}/api/tournaments/active`),
      ]);

      const bookings = await bookingsRes.json();
      const courts = await courtsRes.json();
      const users = await usersRes.json();
      const tournaments = await tournamentsRes.json();

      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);

      const todayBookings = bookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= todayStart && bookingDate <= todayEnd;
      });

      const monthBookings = bookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      });

      const monthRevenue = monthBookings.reduce((sum: number, b: any) => {
        if (b.status === "COMPLETED" || b.status === "CONFIRMED") {
          return sum + (b.total_price || 0);
        }
        return sum;
      }, 0);

      const todayRevenue = todayBookings.reduce((sum: number, b: any) => {
        if (b.status === "COMPLETED" || b.status === "CONFIRMED") {
          return sum + (b.total_price || 0);
        }
        return sum;
      }, 0);

      const newUsers = users.filter((u: any) => {
        const userDate = new Date(u.createdAt);
        return userDate >= monthStart && userDate <= monthEnd;
      }).length;

      const availableCourts = courts.filter((c: any) => c.status === "AVAILABLE").length;
      const availablePercentage = courts.length > 0 
        ? Math.round((availableCourts / courts.length) * 100) 
        : 0;

      const pendingBookings = bookings.filter((b: any) => b.status === "PENDING").length;

      setStats({
        todayBookings: todayBookings.length,
        monthRevenue,
        newUsers,
        availableCourtsPercentage: availablePercentage,
        totalCourts: courts.length,
        activeTournaments: tournaments.length,
        pendingBookings,
        todayRevenue,
      });

      const recent = bookings
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
      setRecentBookings(recent);

      const hours = Array.from({ length: 16 }, (_, i) => i + 6);
      const hourlyData = hours.map(hour => ({
        hour: `${hour}:00`,
        available: Math.floor(Math.random() * courts.length) + 1,
        booked: Math.floor(Math.random() * courts.length),
      }));
      setHourlySlots(hourlyData);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    CHECKED_IN: "bg-purple-100 text-purple-800",
  };

  const statusLabels: Record<string, string> = {
    PENDING: "Chờ xử lý",
    CONFIRMED: "Đã xác nhận",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    CHECKED_IN: "Đã check-in",
  };

  const hourlyChartData = {
    labels: hourlySlots.map(slot => slot.hour),
    datasets: [
      {
        label: "Sân trống",
        data: hourlySlots.map(slot => slot.available),
        backgroundColor: "rgba(16, 185, 129, 0.6)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1,
      },
      {
        label: "Đã đặt",
        data: hourlySlots.map(slot => slot.booked),
        backgroundColor: "rgba(239, 68, 68, 0.6)",
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Dashboard Quản Trị
        </h1>
        <div className="text-sm text-gray-600">
          {format(new Date(), "dd/MM/yyyy HH:mm")}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-md border border-slate-200 hover:shadow-lg transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Đặt Sân Hôm Nay</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {stats.todayBookings}
              </p>
              <p className="text-xs text-green-600 mt-1">
                +{stats.todayRevenue.toLocaleString()}đ
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600 shadow-inner">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-md border border-slate-200 hover:shadow-lg transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Doanh Thu Tháng</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {(stats.monthRevenue / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.monthRevenue.toLocaleString()}đ
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 text-green-600 shadow-inner">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-md border border-slate-200 hover:shadow-lg transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Người Dùng Mới</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {stats.newUsers}
              </p>
              <p className="text-xs text-gray-500 mt-1">Tháng này</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-md border border-slate-200 hover:shadow-lg transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sân Có Sẵn</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {stats.availableCourtsPercentage}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalCourts} sân
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100 text-orange-600 shadow-inner">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Link href="/admin/bookings">
          <div className="bg-linear-to-r from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-md border border-yellow-200 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-800">Chờ Xử Lý</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">
                  {stats.pendingBookings}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </Link>

        <Link href="/admin/tournaments">
          <div className="bg-linear-to-r from-pink-50 to-pink-100 p-6 rounded-xl shadow-md border border-pink-200 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-800">Giải Đấu Đang Diễn</p>
                <p className="text-2xl font-bold text-pink-900 mt-1">
                  {stats.activeTournaments}
                </p>
              </div>
              <Trophy className="w-8 h-8 text-pink-600" />
            </div>
          </div>
        </Link>

        <Link href="/admin/courts">
          <div className="bg-linear-to-r from-cyan-50 to-cyan-100 p-6 rounded-xl shadow-md border border-cyan-200 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-800">Tổng Sân</p>
                <p className="text-2xl font-bold text-cyan-900 mt-1">
                  {stats.totalCourts}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-cyan-600" />
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-md border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Tình Trạng Sân Theo Giờ
            </h3>
            <Link href="/admin/slots" className="text-sm text-cyan-600 hover:underline">
              Xem chi tiết
            </Link>
          </div>
          <div className="h-80">
            <Bar data={hourlyChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-md border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Đặt Sân Gần Đây
            </h3>
            <Link href="/admin/bookings" className="text-sm text-cyan-600 hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentBookings.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                Chưa có đặt sân nào
              </p>
            ) : (
              recentBookings.map((booking) => (
                <div
                  key={booking.bookingID}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-slate-800">
                        {booking.user?.full_name || booking.phone_user || "Khách vãng lai"}
                      </p>
                      <p className="text-xs text-gray-600">
                        {booking.court?.name || "N/A"}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        statusColors[booking.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusLabels[booking.status] || booking.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{format(new Date(booking.booking_date), "dd/MM/yyyy")}</span>
                    <span className="font-semibold text-green-600">
                      {booking.total_price.toLocaleString()}đ
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
