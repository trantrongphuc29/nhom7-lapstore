import React, { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import AdminLayout from "../components/layout/AdminLayout";
import AdminAuditLogsPage from "../pages/AdminAuditLogsPage";
import AdminProductCreatePage from "../pages/AdminProductCreatePage";
import AdminProductEditPage from "../pages/AdminProductEditPage";
import AdminOrdersPage from "../pages/AdminOrdersPage";
import AdminCustomersPage from "../pages/AdminCustomersPage";
import AdminProductsListPage from "../pages/AdminProductsListPage";
import AdminPromotionsPage from "../pages/AdminPromotionsPage";
import AdminSettingsPage from "../pages/AdminSettingsPage";
import AdminTaxonomyPage from "../pages/AdminTaxonomyPage";

const AdminDashboardOverviewPage = lazy(() => import("../pages/AdminDashboardOverviewPage"));

function AdminRoutes() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Đang tải module quản trị...</div>}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboardOverviewPage />} />
          <Route path="products" element={<AdminProductsListPage />} />
          <Route path="products/new" element={<AdminProductCreatePage />} />
          <Route path="products/:id/edit" element={<AdminProductEditPage />} />
          <Route path="brands" element={<AdminTaxonomyPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/pending" element={<AdminOrdersPage pendingOnly />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="promotions" element={<AdminPromotionsPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AdminRoutes;
