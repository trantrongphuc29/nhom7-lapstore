import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { useAdminDashboardQuery } from "../../hooks/useAdminDashboardQuery";

export default function AdminLayout() {
  const { data } = useAdminDashboardQuery();
  return (
    <div className="admin-panel min-h-screen bg-slate-50 flex">
      <AdminSidebar badges={{ pendingOrders: data?.pendingOrders || 0 }} />
      <div className="flex-1 min-w-0">
        <AdminTopbar />
        <main className="p-6 max-w-[1440px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
