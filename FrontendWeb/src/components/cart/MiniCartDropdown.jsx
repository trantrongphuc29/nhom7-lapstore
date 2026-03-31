import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BACKEND_BASE_URL } from "../../config/api";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { fmtPrice } from "../../utils/format";
import LoginModal from "./LoginModal";

export default function MiniCartDropdown({ open, onClose, anchorRef }) {
  const { items, updateQuantity, removeLine, restoreLine, totals, allInStock } = useCart();
  const { isAuthenticated } = useAuth();
  const { undo, error: toastError } = useToast();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    const onDown = (e) => {
      if (anchorRef?.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, onClose, anchorRef]);

  const imgSrc = (url) =>
    url ? (url.startsWith("http") ? url : `${BACKEND_BASE_URL}/${url}`) : null;

  const handleCheckout = () => {
    if (items.length === 0) return;
    if (!allInStock) {
      toastError("Sản phẩm đã hết hàng");
      return;
    }
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    navigate("/thong-tin-nhan-hang");
  };

  const goCheckoutGuest = () => {
    navigate("/thong-tin-nhan-hang");
  };

  if (!open) return null;

  return (
    <>
    <div
      ref={panelRef}
      className={[
        "z-[130] bg-white border border-slate-200 shadow-xl flex flex-col overflow-hidden",
        "w-[min(380px,calc(100vw-2rem))]",
        "transition-all duration-200 ease-out",
        open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none",
        "fixed left-1/2 -translate-x-1/2 bottom-4 max-h-[min(85vh,560px)] rounded-2xl",
        "md:absolute md:left-auto md:right-0 md:bottom-auto md:top-full md:mt-2 md:translate-x-0 md:translate-y-0 md:max-h-[560px]",
      ].join(" ")}
    >
      <div className="px-4 py-3 border-b border-slate-100 font-bold text-slate-900 text-sm shrink-0">
        Giỏ hàng ({items.reduce((s, i) => s + i.quantity, 0)})
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-200 mb-3">shopping_cart</span>
          <p className="text-slate-600 font-medium mb-4">Giỏ hàng trống</p>
          <Link
            to="/"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 transition"
          >
            Khám phá ngay
          </Link>
        </div>
      ) : (
        <>
          <div className="mini-cart-scroll overflow-y-auto max-h-[320px] flex-1 min-h-0">
            <ul className="divide-y divide-slate-100">
              {items.map((li) => (
                <li key={li.lineId} className="p-3 flex gap-3">
                  <div className="w-14 h-14 rounded-lg border border-slate-100 bg-slate-50 overflow-hidden shrink-0">
                    {imgSrc(li.image) ? (
                      <img src={imgSrc(li.image)} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <span className="material-symbols-outlined text-2xl">laptop</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug">{li.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{li.specSummary}</p>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <div className="inline-flex items-center border border-slate-200 rounded-lg">
                        <button
                          type="button"
                          disabled={li.quantity <= 1}
                          onClick={() => updateQuantity(li.lineId, li.quantity - 1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold"
                        >
                          −
                        </button>
                        <span className="px-2 text-xs font-semibold tabular-nums min-w-[1.5rem] text-center">
                          {li.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={li.quantity >= (Number(li.stock) || 0)}
                          onClick={() => updateQuantity(li.lineId, li.quantity + 1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const backup = { ...li };
                          removeLine(li.lineId);
                          const shortName = li.name.length > 32 ? `${li.name.slice(0, 32)}…` : li.name;
                          undo(`Đã xóa ${shortName}.`, () => restoreLine(backup), { duration: 5000 });
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        aria-label="Xóa"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                    <p className="text-xs font-bold text-rose-600 mt-1 tabular-nums">{fmtPrice(li.price * li.quantity)}₫</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/80 shrink-0">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Tạm tính</span>
              <span className="font-semibold tabular-nums">{fmtPrice(totals.subtotal)}₫</span>
            </div>
            <div className="flex gap-2">
              <Link
                to="/gio-hang"
                className="flex-1 text-center rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition"
              >
                Xem tất cả
              </Link>
              <button
                type="button"
                onClick={handleCheckout}
                className="flex-1 rounded-xl text-[#CCFF00] bg-slate-900  py-2.5 text-sm font-bold hover:brightness-95 transition"
              >
                Đặt hàng ngay
              </button>
            </div>
          </div>
        </>
      )}
    </div>
    <LoginModal open={showLogin} onClose={() => setShowLogin(false)} onGuestContinue={goCheckoutGuest} />
    </>
  );
}
