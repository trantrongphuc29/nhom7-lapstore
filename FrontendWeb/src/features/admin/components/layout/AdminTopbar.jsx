import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";
import { ADMIN_MENU } from "../../constants/menu";
import { useAdminUiStore } from "../../store/adminUiStore";
import { useAdminDashboardQuery } from "../../hooks/useAdminDashboardQuery";

export default function AdminTopbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toggleSidebar } = useAdminUiStore();
  const { data } = useAdminDashboardQuery();
  const pending = data?.pendingOrders ?? 0;
  const preview = data?.pendingOrdersPreview ?? [];
  const prevPendingRef = useRef(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (prevPendingRef.current != null && pending > prevPendingRef.current) {
      const delta = pending - prevPendingRef.current;
      toast.success(delta === 1 ? "Có đơn hàng mới cần xử lý" : `Có ${delta} đơn mới cần xử lý`);
    }
    prevPendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    if (!notifOpen) return undefined;
    const onDoc = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [notifOpen]);

  const pathLabelMap = useMemo(() => {
    const map = {};
    ADMIN_MENU.forEach((item) => {
      if (item.path) map[item.path] = item.label;
      (item.children || []).forEach((child) => {
        map[child.path] = child.label;
      });
    });
    return map;
  }, []);
  const crumbs = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const pathParts = [];
    return segments.map((segment) => {
      pathParts.push(segment);
      const currentPath = `/${pathParts.join("/")}`;
      return pathLabelMap[currentPath] || segment;
    });
  }, [location.pathname, pathLabelMap]);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3 ">
        <button type="button" onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-slate-100 ">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="text-sm font-semibold text-slate-500 ">{crumbs.join(" / ") || "Dashboard"}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative" ref={panelRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2 rounded-lg hover:bg-slate-100"
            aria-label="Thông báo đơn hàng"
          >
            <span className="material-symbols-outlined">notifications</span>
            {pending > 0 ? (
              <span className="absolute top-1 right-1 min-w-[1rem] h-4 px-1 flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none">
                {pending > 99 ? "99+" : pending}
              </span>
            ) : null}
          </button>
          {notifOpen ? (
            <div className="absolute right-0 mt-2 w-80 max-h-[min(70vh,24rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg z-50 text-left">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">Đơn cần xử lý</p>
                {pending > 0 ? (
                  <span className="text-xs font-bold tabular-nums text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{pending}</span>
                ) : null}
              </div>
              {preview.length === 0 ? (
                <p className="px-3 py-6 text-sm text-slate-500 text-center">Không có đơn chờ xử lý.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {preview.map((o) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition"
                        onClick={() => {
                          setNotifOpen(false);
                          navigate("/admin/orders/pending", { state: { selectOrderId: o.id } });
                        }}
                      >
                        <p className="text-sm font-medium text-slate-800 font-mono">{o.code}</p>
                        <p className="text-xs text-slate-600 truncate">{o.customerName || "Khách"}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : ""}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-semibold">
            {user?.email?.slice(0, 1)?.toUpperCase() || "A"}
          </div>
          <button type="button" onClick={logout} className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
