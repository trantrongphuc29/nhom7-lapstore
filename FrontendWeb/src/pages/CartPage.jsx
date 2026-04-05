import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { BACKEND_BASE_URL } from "../config/api";
import { useCart, stockStatus } from "../context/CartContext";
import { useStoreConfig } from "../context/StoreConfigContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fmtPrice } from "../utils/format";
import { storefrontProductPath } from "../utils/productPaths";
import LoginModal from "../components/cart/LoginModal";
import CheckoutProgress from "../components/cart/CheckoutProgress";

function StockTag({ stock, qty }) {
  const st = stockStatus(stock, qty);
  if (st === "out")
    return <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-700">Hết hàng</span>;
  if (st === "low")
    return <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">Sắp hết</span>;
  return <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Còn hàng</span>;
}

export default function CartPage() {
  const { freeShippingThreshold } = useStoreConfig();
  const { items, updateQuantity, removeLine, totals, allInStock } = useCart();
  const { isAuthenticated } = useAuth();
  const { error: toastError } = useToast();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(() => new Set(items.map((i) => i.lineId)));
  const [updating, setUpdating] = useState({});
  const [showLogin, setShowLogin] = useState(false);
  const syncTimers = useRef({});

  useEffect(() => {
    setSelected(new Set(items.map((i) => i.lineId)));
  }, [items]);

  const toggleSelect = (lineId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.lineId)));
  };

  const bulkDelete = () => {
    selected.forEach((id) => removeLine(id));
    setSelected(new Set());
  };

  /** Cập nhật số lượng ngay; spinner kết thúc sau 500ms kể từ lần thay đổi cuối (mô phỏng debounce API). */
  const bumpQty = (lineId, nextQty) => {
    updateQuantity(lineId, nextQty);
    setUpdating((u) => ({ ...u, [lineId]: true }));
    if (syncTimers.current[lineId]) clearTimeout(syncTimers.current[lineId]);
    syncTimers.current[lineId] = setTimeout(() => {
      setUpdating((u) => ({ ...u, [lineId]: false }));
      delete syncTimers.current[lineId];
    }, 500);
  };

  const imgSrc = (url) =>
    url ? (url.startsWith("http") ? url : `${BACKEND_BASE_URL}/${url}`) : null;

  const goCheckout = () => {
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

  return (
    <div className="bg-slate-50 font-display text-slate-900 min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Giỏ hàng</h1>
        <CheckoutProgress current="cart" />

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-200">shopping_cart</span>
            <p className="text-slate-600 mt-4 mb-6">Giỏ hàng của bạn đang trống.</p>
            <Link to="/" className="inline-flex rounded-xl bg-slate-900 text-white px-6 py-3 font-semibold hover:bg-slate-800 transition">
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
            <div className="flex-1 w-full min-w-0 space-y-3 pb-28 lg:pb-0">
              <div className="flex items-center gap-3 text-sm mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selected.size === items.length && items.length > 0} onChange={toggleAll} className="rounded border-slate-300" />
                  <span>Chọn tất cả</span>
                </label>
                {selected.size > 0 ? (
                  <button type="button" onClick={bulkDelete} className="text-rose-600 font-medium hover:underline">
                    Xóa đã chọn ({selected.size})
                  </button>
                ) : null}
              </div>

              {items.map((li) => {
                const st = stockStatus(li.stock, li.quantity);
                const out = st === "out" || li.quantity > (Number(li.stock) || 0);
                return (
                  <div
                    key={li.lineId}
                    className={`relative bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-4 ${
                      out ? "opacity-75" : ""
                    }`}
                  >
                    {out ? (
                      <div className="absolute inset-0 bg-white/70 rounded-2xl flex flex-col items-center justify-center z-10 gap-2">
                        <span className="font-bold text-slate-800">Hết hàng</span>
                        <button
                          type="button"
                          onClick={() => removeLine(li.lineId)}
                          className="text-sm text-rose-600 font-semibold underline"
                        >
                          Xóa khỏi giỏ
                        </button>
                      </div>
                    ) : null}
                    <label className="flex items-start gap-3 shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={selected.has(li.lineId)}
                        onChange={() => toggleSelect(li.lineId)}
                        className="mt-1 rounded border-slate-300"
                      />
                    </label>
                    <Link to={storefrontProductPath({ id: li.productId, slug: li.productSlug })} className="shrink-0 w-[100px] h-[100px] rounded-xl border border-slate-100 bg-slate-50 overflow-hidden flex items-center justify-center">
                      {imgSrc(li.image) ? (
                        <img src={imgSrc(li.image)} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <span className="material-symbols-outlined text-4xl text-slate-200">laptop</span>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={storefrontProductPath({ id: li.productId, slug: li.productSlug })} className="font-bold text-slate-900 line-clamp-2 hover:text-slate-700 transition">
                        {li.name}
                      </Link>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{li.specSummary}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StockTag stock={li.stock} qty={li.quantity} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center border border-slate-200 rounded-lg">
                          <button
                            type="button"
                            disabled={li.quantity <= 1 || updating[li.lineId]}
                            onClick={() => bumpQty(li.lineId, li.quantity - 1)}
                            className="px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-40 font-bold"
                          >
                            −
                          </button>
                          <span className="px-3 text-sm font-semibold tabular-nums min-w-[2rem] text-center relative">
                            {updating[li.lineId] ? (
                              <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                            ) : (
                              li.quantity
                            )}
                          </span>
                          <button
                            type="button"
                            disabled={li.quantity >= (Number(li.stock) || 0) || updating[li.lineId]}
                            onClick={() => bumpQty(li.lineId, li.quantity + 1)}
                            className="px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:opacity-40 font-bold"
                          >
                            +
                          </button>
                        </div>
                        <button type="button" onClick={() => removeLine(li.lineId)} className="text-sm text-rose-400 hover:text-rose-600 font-medium">
                          Xóa
                        </button>
                      </div>
                    </div>
                    <div className="text-right sm:min-w-[120px]">
                      <p className="text-lg font-bold text-rose-600 tabular-nums">{fmtPrice(li.price * li.quantity)}₫</p>
                      <p className="text-xs text-slate-500 mt-1">{fmtPrice(li.price)}₫ / sản phẩm</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="w-full lg:w-[360px] shrink-0 lg:sticky lg:top-24 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h2 className="font-bold text-slate-900 mb-4">Tóm tắt đơn hàng</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tạm tính</span>
                    <span className="font-medium tabular-nums">{fmtPrice(totals.subtotal)}₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Khuyến mãi</span>
                    <span className="font-medium text-rose-600 tabular-nums">-{fmtPrice(totals.discount)}₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Phí vận chuyển</span>
                    <span className="font-medium tabular-nums">
                      {totals.shippingFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `${fmtPrice(totals.shippingFee)}₫`}
                    </span>
                  </div>
                  {totals.subtotal < freeShippingThreshold && totals.subtotal > 0 ? (
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5">
                      Mua thêm {fmtPrice(freeShippingThreshold - totals.subtotal)}₫ để được freeship.
                    </p>
                  ) : null}
                </div>
                <div className="border-t border-slate-200 my-4" />
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-slate-800 font-semibold">Tổng cộng</span>
                  <span className="text-2xl font-extrabold px-3 py-1 rounded-lg tabular-nums">
                    {fmtPrice(totals.total)}₫
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Giá đã bao gồm VAT</p>
                <button
                  type="button"
                  onClick={goCheckout}
                  disabled={!allInStock}
                  className="mt-5 w-full rounded-xl bg-slate-900 text-white py-3.5 font-bold text-base hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ĐẶT HÀNG
                </button>
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-3 justify-center text-[11px] text-slate-500">
                  <span>Hàng chính hãng</span>
                  <span>·</span>
                  <span>Đổi trả 30 ngày</span>
                  <span>·</span>
                  <span>Bảo hành tận nhà</span>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Mobile sticky bar */}
        {items.length > 0 ? (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <div>
              <p className="text-xs text-slate-500">Tổng</p>
              <p className="text-lg font-bold text-rose-600 tabular-nums">{fmtPrice(totals.total)}₫</p>
            </div>
            <button
              type="button"
              onClick={goCheckout}
              disabled={!allInStock}
              className="rounded-xl bg-[#CCFF00] text-black px-5 py-3 font-bold text-sm shrink-0 disabled:opacity-50"
            >
              ĐẶT HÀNG →
            </button>
          </div>
        ) : null}
      </main>
      <Footer />
      <LoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onGuestContinue={goCheckoutGuest}
      />
    </div>
  );
}
