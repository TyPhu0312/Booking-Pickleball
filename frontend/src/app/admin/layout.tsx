"use client";

import Sidebar, { SidebarProvider, useSidebar } from "@/components/admin/Sidebar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  userID: string;
  full_name: string;
  role: {
    roleID: string;
    name: string;
  };
}

function AdminContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  
  return (
    <>
      <Sidebar />
      <main className={`p-8 transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        {children}
      </main>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const userStr = localStorage.getItem("user");
        
        if (!userStr) {
          router.push("/login");
          return;
        }

        const user: User = JSON.parse(userStr);
        
        if (!user.role || (user.role.name !== "admin" && user.role.name !== "superadmin")) {
          alert("Bạn không có quyền truy cập trang quản trị!");
          router.push("/");
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("Lỗi khi kiểm tra quyền:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        <AdminContent>{children}</AdminContent>
      </div>
    </SidebarProvider>
  );
}