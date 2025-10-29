// components/admin/Sidebar.tsx
import Link from "next/link";
import { LayoutDashboard, Calendar, Users, Trophy, BarChart3, Settings, Clock } from "lucide-react";

export default function Sidebar() {
    return (
        <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r">
            <div className="p-6 border-b">
                <h1 className="text-2xl font-bold text-blue-600">Admin Panel</h1>
                <p className="text-sm text-gray-600">Sao Mai Pickleball</p>
            </div>

            <nav className="mt-6">
                <Link href="/admin" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
                    <LayoutDashboard className="w-5 h-5 mr-3" />
                    Dashboard
                </Link>
                <Link href="/admin/courts" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
                    <Calendar className="w-5 h-5 mr-3" />
                    Quản Lý Sân
                </Link>
                <Link href="/admin/bookings" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
                    <Calendar className="w-5 h-5 mr-3" />
                    Quản Lý Đặt Sân
                </Link>
                <Link href="/admin/slots" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
                    <Clock className="w-5 h-5 mr-3" />
                    Quản Lý Slots
                </Link>
                <Link href="/admin/tournaments" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
                    <Trophy className="w-5 h-5 mr-3" />
                    Quản Lý Giải Đấu
                </Link>
                <Link href="/admin/users" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
                    <Users className="w-5 h-5 mr-3" />
                    Quản Lý Người Dùng
                </Link>
                <Link href="/admin/stats" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
                    <BarChart3 className="w-5 h-5 mr-3" />
                    Thống Kê
                </Link>
                <Link href="/admin/settings" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
                    <Settings className="w-5 h-5 mr-3" />
                    Cài Đặt
                </Link>
            </nav>
        </div>
    );
}