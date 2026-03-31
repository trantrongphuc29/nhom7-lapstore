import React from 'react';
import { useAuth } from '../context/AuthContext';

function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-3">Trang quản trị</h1>
        <p className="text-slate-600 mb-8">
          Xin chào <span className="font-semibold">{user?.email}</span>. Bạn đang đăng nhập với quyền admin.
        </p>
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">Tổng quan hệ thống</h2>
          <p className="text-slate-600">
            Khu vực này sẵn sàng để mở rộng dashboard quản lý đơn hàng, sản phẩm, người dùng.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
