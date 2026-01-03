"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Trophy,
  BarChart3,
  Settings,
  Clock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  PenLine,
  DollarSign,
  MessageSquare,
  Shield,
} from "lucide-react";
import { useState, createContext, useContext, useEffect } from "react";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebar();
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      const role = typeof user.role === "string" ? user.role : user.role?.name;
      setUserRole(role || "");
    }
  }, []);

  const baseMenuItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/courts", label: "Quản Lý Sân", icon: Calendar },
    { href: "/admin/bookings", label: "Quản Lý Đặt Sân", icon: Calendar },
    { href: "/admin/slots", label: "Quản Lý Slots", icon: Clock },
    { href: "/admin/tournaments", label: "Giải Đấu", icon: Trophy },
    { href: "/admin/users", label: "Người Dùng", icon: Users },
    { href: "/admin/blogs", label: "Bài viết", icon: PenLine },
    { href: "/admin/payments", label: "Thanh toán", icon: CircleDollarSign },
    { href: "/admin/refunds", label: "Hoàn tiền", icon: DollarSign },
    { href: "/admin/feedbacks", label: "Phản hồi", icon: MessageSquare },
    { href: "/admin/stats", label: "Báo cáo", icon: BarChart3 },
  ];

  const menuItems = userRole === "superadmin"
    ? [...baseMenuItems, { href: "/admin/roles", label: "Vai Trò", icon: Shield }]
    : baseMenuItems;

  return (
    <div
      className={`fixed top-0 left-0 h-screen transition-all duration-300 shadow-xl border-r border-slate-800 bg-linear-to-b from-slate-900 to-slate-800 ${collapsed ? "w-20" : "w-64"
        }`}
    >
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700">
        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold text-cyan-400">Admin Panel</h1>
            <p className="text-xs text-slate-400">Sao Mai Pickleball</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-300 hover:text-cyan-400 transition"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      <nav className="mt-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center mx-3 rounded-lg px-4 py-3 transition-all duration-200 ${active
                  ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/40 shadow-sm"
                  : "text-slate-300 hover:text-cyan-300 hover:bg-slate-700/50"
                }`}
            >
              <Icon className="w-5 h-5 mr-3 shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium tracking-wide">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-full border-t border-slate-700">
        <button className="flex items-center w-full px-5 py-3 text-slate-400 hover:bg-slate-700 hover:text-cyan-300 transition">
          <LogOut className="w-5 h-5 mr-3" />
          {!collapsed && <span>Đăng Xuất</span>}
        </button>
      </div>
    </div>
  );
}
