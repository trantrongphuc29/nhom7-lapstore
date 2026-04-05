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
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50 font-display text-slate-900">
      <Header />
      <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-3 py-4 sm:px-4 sm:py-6">
        <h1 className="mb-2 text-xl font-bold text-slate-900 sm:text-2xl">Giỏ hàng</h1>
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
          <div className="flex w-full flex-col items-start gap-6 lg:flex-row lg:gap-8">
            <div className="w-full min-w-0 flex-1 space-y-3 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
              <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={selected.size === items.length && items.length > 0} onChange={toggleAll} className="rounded border-slate-300" />
                  <span>Chọn tất cả</span>
                </label>
                {selected.size > 0 ? (
                  <button type="button" onClick={bulkDelete} className="font-medium text-rose-600 hover:underline">
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
                    className={`relative flex min-w-0 gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2.5 sm:gap-3 sm:p-4 ${
                      out ? "opacity-75" : ""
                    }`}
                  >
                    {out ? (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/70">
                        <span className="font-bold text-slate-800">Hết hàng</span>
                        <button
                          type="button"
                          onClick={() => removeLine(li.lineId)}
                          className="text-sm font-semibold text-rose-600 underline"
                        >
                          Xóa khỏi giỏ
                        </button>
                      </div>
                    ) : null}
                    <label className="shrink-0 pt-0.5">
                      <input
                        type="checkbox"
                        checked={selected.has(li.lineId)}
                        onChange={() => toggleSelect(li.lineId)}
                        className="mt-1 rounded border-slate-300"
                      />
                    </label>
                    <Link
                      to={storefrontProductPath({ id: li.productId, slug: li.productSlug })}
                      className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50 sm:h-20 sm:w-20 sm:rounded-xl md:h-[100px] md:w-[100px]"
                    >
                      {imgSrc(li.image) ? (
                        <img src={imgSrc(li.image)} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <span className="material-symbols-outlined text-3xl text-slate-200 sm:text-4xl">laptop</span>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1 sm:flex sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={storefrontProductPath({ id: li.productId, slug: li.productSlug })}
                            className="line-clamp-2 min-w-0 flex-1 break-words font-bold leading-snug text-slate-900 transition hover:text-slate-700"
                          >
                            {li.name}
                          </Link>
                          <p className="shrink-0 text-right text-sm font-bold tabular-nums text-rose-600 sm:hidden">
                            {fmtPrice(li.price * li.quantity)}₫
                          </p>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600 sm:text-sm">{li.specSummary}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StockTag stock={li.stock} qty={li.quantity} />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <div className="inline-flex items-center rounded-lg border border-slate-200">
                            <button
                              type="button"
                              disabled={li.quantity <= 1 || updating[li.lineId]}
                              onClick={() => bumpQty(li.lineId, li.quantity - 1)}
                              className="px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 sm:px-3"
                            >
                              −
                            </button>
                            <span className="relative min-w-[2rem] px-2 text-center text-sm font-semibold tabular-nums sm:px-3">
                              {updating[li.lineId] ? (
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
                              ) : (
                                li.quantity
                              )}
                            </span>
                            <button
                              type="button"
                              disabled={li.quantity >= (Number(li.stock) || 0) || updating[li.lineId]}
                              onClick={() => bumpQty(li.lineId, li.quantity + 1)}
                              className="px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 sm:px-3"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLine(li.lineId)}
                            className="text-sm font-medium text-rose-400 hover:text-rose-600"
                          >
                            Xóa
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 sm:hidden">{fmtPrice(li.price)}₫ / sản phẩm</p>
                      </div>
                      <div className="hidden min-w-[120px] shrink-0 text-right sm:block">
                        <p className="text-lg font-bold tabular-nums text-rose-600">{fmtPrice(li.price * li.quantity)}₫</p>
                        <p className="mt-1 text-xs text-slate-500">{fmtPrice(li.price)}₫ / sản phẩm</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="hidden w-full shrink-0 space-y-4 lg:block lg:w-[360px] lg:sticky lg:top-24">
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
          <div className="fixed bottom-0 left-0 right-0 z-40 flex max-w-[100vw] items-center justify-between gap-2 border-t border-slate-200 bg-white/95 px-3 pt-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur sm:gap-3 sm:px-4 sm:pt-3 lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="min-w-0 flex-1 pr-1">
              <p className="text-[10px] text-slate-500 sm:text-[11px]">Tổng thanh toán</p>
              <p className="text-base font-bold tabular-nums text-rose-600 sm:text-lg">{fmtPrice(totals.total)}₫</p>
            </div>
            <button
              type="button"
              onClick={goCheckout}
              disabled={!allInStock}
              className="shrink-0 rounded-xl bg-[#CCFF00] px-4 py-2.5 text-xs font-bold text-black sm:px-5 sm:py-3 sm:text-sm disabled:opacity-50"
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
