"use client";

import Sidebar, { SidebarProvider, useSidebar } from "@/components/admin/Sidebar";

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
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        <AdminContent>{children}</AdminContent>
      </div>
    </SidebarProvider>
  );
}