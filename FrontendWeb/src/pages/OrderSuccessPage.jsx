import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { ORDER_SUCCESS_FLAG, ORDER_SUCCESS_ORDER_CODE } from "../utils/checkoutFlow";

export default function OrderSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);
  const [orderCode, setOrderCode] = useState("");

  const orderCodeFromState = useMemo(() => location.state?.orderCode ?? "", [location.state?.orderCode]);

  useEffect(() => {
    try {
      const ok = sessionStorage.getItem(ORDER_SUCCESS_FLAG);
      // Nếu truyền orderCode qua navigate state thì vẫn cho phép hiển thị,
      // tránh case sessionStorage không kịp/không còn.
      if (!ok && !orderCodeFromState) {
        navigate("/", { replace: true });
        return;
      }

      if (ok) sessionStorage.removeItem(ORDER_SUCCESS_FLAG);
      const codeFromSession = sessionStorage.getItem(ORDER_SUCCESS_ORDER_CODE) || "";
      // Xoá mã lưu session để tránh hiển thị lại khi mở lại trang.
      sessionStorage.removeItem(ORDER_SUCCESS_ORDER_CODE);

      setOrderCode(orderCodeFromState || codeFromSession);
      setAllowed(true);
    } catch {
      navigate("/", { replace: true });
    }
  }, [navigate, orderCodeFromState]);

  if (!allowed) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center text-slate-500 text-sm">Đang tải...</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 font-display text-slate-900 min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-lg mx-auto px-4 py-16 w-full flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-5xl">check_circle</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Đặt hàng thành công</h1>
        {orderCode ? (
          <p className="text-sm text-slate-800 mb-2">
            Mã đơn hàng:{" "}
            <span className="font-mono font-bold tracking-tight bg-slate-100 px-2 py-0.5 rounded-md">{orderCode}</span>
          </p>
        ) : null}
        <p className="text-slate-600 mb-8 leading-relaxed">
          Cảm ơn bạn đã đặt hàng tại LAPSTORE. Đơn hàng đã được ghi nhận. Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:justify-center">
          <Link
            to="/"
            className="inline-flex justify-center rounded-xl bg-slate-900 text-white px-8 py-3 font-bold hover:bg-slate-800 transition"
          >
            Về trang chủ
          </Link>
          <Link
            to="/tai-khoan/don-hang"
            className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-8 py-3 font-semibold text-slate-800 hover:bg-slate-50 transition"
          >
            Xem đơn hàng
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
