import React from "react";
import { Link } from "react-router-dom";

export default function LoginModal({ open, onClose, onGuestContinue }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/50 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-lg font-bold text-slate-900 mb-2">Đăng nhập</h3>
        <p className="text-sm text-slate-600 mb-5">
          Đăng nhập để theo dõi đơn hàng và tích điểm. Bạn cũng có thể thanh toán nhanh với tài khoản khách.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            to="/login"
            className="w-full rounded-xl bg-slate-900 text-white text-center py-3 font-semibold hover:bg-slate-800 transition"
            onClick={onClose}
          >
            Đăng nhập
          </Link>
          <button
            type="button"
            onClick={() => {
              onGuestContinue?.();
              onClose();
            }}
            className="w-full rounded-xl border border-slate-300 py-3 font-semibold text-slate-800 hover:bg-slate-50 transition"
          >
            Tiếp tục không đăng nhập
          </button>
          <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800 py-2">
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
