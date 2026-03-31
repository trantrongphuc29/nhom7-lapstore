import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { BACKEND_BASE_URL } from "../config/api";
import { useCart, FREE_SHIPPING_THRESHOLD } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fmtPrice } from "../utils/format";
import LoginModal from "../components/cart/LoginModal";
import CheckoutProgress from "../components/cart/CheckoutProgress";
import { clearShippingDraft, loadShippingDraft, storeLabel, ORDER_SUCCESS_FLAG, ORDER_SUCCESS_ORDER_CODE } from "../utils/checkoutFlow";
import { previewVoucher } from "../services/vouchers.service";
import { createStorefrontOrder } from "../services/orders.service";

export default function CheckoutPage() {
  const location = useLocation();
  const { items, totals, allInStock, clear, appliedVoucherCode, applyVoucherDiscount, clearVoucherDiscount } = useCart();
  const { isAuthenticated, token } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const shipping = useMemo(() => {
    const fromNav = location.state?.shipping;
    if (fromNav && typeof fromNav === "object" && fromNav.fulfillment) return fromNav;
    return loadShippingDraft();
  }, [location.state]);

  const rawSubtotal = useMemo(
    () => items.reduce((s, li) => s + Number(li.price) * Number(li.quantity), 0),
    [items]
  );

  useEffect(() => {
    let checkoutSuccessPending = false;
    try {
      checkoutSuccessPending = Boolean(sessionStorage.getItem(ORDER_SUCCESS_FLAG));
    } catch {
      /* ignore */
    }
    if (items.length === 0 && !checkoutSuccessPending) {
      navigate("/gio-hang", { replace: true });
      return;
    }
    if (!shipping?.fulfillment) {
      navigate("/thong-tin-nhan-hang", { replace: true });
    }
  }, [items.length, navigate, shipping]);

  const imgSrc = (url) =>
    url ? (url.startsWith("http") ? url : `${BACKEND_BASE_URL}/${url}`) : null;

  const shippingSummary = () => {
    if (!shipping?.fulfillment) return null;
    if (shipping.fulfillment === "pickup") {
      return (
        <div className="text-sm text-slate-700 space-y-1">
          <p>
            <span className="text-slate-500">Hình thức:</span> Nhận tại cửa hàng
          </p>
          <p className="line-clamp-3">{storeLabel(shipping.pickupStoreId)}</p>
          <p>
            {shipping.pickupName} · {shipping.pickupPhone}
          </p>
        </div>
      );
    }
    return (
      <div className="text-sm text-slate-700 space-y-1">
        <p>
          <span className="text-slate-500">Hình thức:</span> Giao tận nơi
        </p>
        <p>
          {shipping.shipName} · {shipping.shipPhone}
        </p>
        <p>
          {shipping.shipRegion} — {shipping.shipAddress}
        </p>
      </div>
    );
  };

  const finalizeCheckout = async () => {
    if (items.length === 0) return;
    if (!allInStock) {
      toastError("Sản phẩm đã hết hàng");
      return;
    }
    if (!shipping?.fulfillment) {
      navigate("/thong-tin-nhan-hang");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        items: items.map((li) => ({
          productId: li.productId,
          variantId: li.variantId,
          quantity: li.quantity,
          name: li.name,
          specSummary: li.specSummary,
        })),
        shipping,
        paymentMethod,
        voucherCode:
          appliedVoucherCode && totals.discount > 0 ? appliedVoucherCode : null,
      };
      const result = await createStorefrontOrder(payload, token || null);
      const code = result?.orderCode != null ? String(result.orderCode) : "";
      try {
        sessionStorage.setItem(ORDER_SUCCESS_FLAG, "1");
        if (code) sessionStorage.setItem(ORDER_SUCCESS_ORDER_CODE, code);
        else sessionStorage.removeItem(ORDER_SUCCESS_ORDER_CODE);
      } catch {
        /* ignore */
      }
      clear();
      clearShippingDraft();
      navigate("/dat-hang-thanh-cong", {
        replace: true,
        state: { orderCode: code || null },
      });
    } catch (e) {
      toastError(e?.message || "Không tạo được đơn hàng. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyVoucher = async () => {
    const code = voucherInput.trim();
    if (!code) {
      toastError("Nhập mã voucher.");
      return;
    }
    setVoucherLoading(true);
    try {
      const data = await previewVoucher(code, rawSubtotal);
      applyVoucherDiscount(data.discountAmount, data.code);
      toastSuccess(`Đã áp dụng mã ${data.code} - giảm ${fmtPrice(data.discountAmount)}₫`);
      setVoucherInput("");
    } catch (e) {
      toastError(e?.message || "Mã không hợp lệ.");
    } finally {
      setVoucherLoading(false);
    }
  };

  const completeOrder = async () => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    await finalizeCheckout();
  };

  const completeGuest = async () => {
    await finalizeCheckout();
  };

  if (items.length === 0 || !shipping?.fulfillment) {
    return null;
  }

  return (
    <div className="bg-slate-50 font-display text-slate-900 min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full pb-32 lg:pb-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center sm:text-left">Thanh toán</h1>
        <p className="text-sm text-slate-600 mb-6 text-center sm:text-left">Chọn phương thức thanh toán và xác nhận đơn hàng.</p>

        <CheckoutProgress current="payment" />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 w-full min-w-0 space-y-6">
            <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-slate-900">Thông tin nhận hàng</h2>
                <Link to="/thong-tin-nhan-hang" className="text-sm font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2">
                  Sửa thông tin
                </Link>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">{shippingSummary()}</div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Mã khuyến mãi</h2>
              <p className="text-sm text-slate-500 mb-4">Nhập mã voucher để giảm trên tạm tính đơn hàng (đã gồm VAT).</p>
              {appliedVoucherCode ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm text-emerald-900">
                    <span className="font-semibold">{appliedVoucherCode}</span>
                    <span className="text-emerald-800"> — giảm </span>
                    <span className="font-bold tabular-nums">{fmtPrice(totals.discount)}₫</span>
                  </p>
                  <button
                    type="button"
                    onClick={clearVoucherDiscount}
                    className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Xóa mã
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value)}
                    placeholder="VD: WELCOME10"
                    className="w-full min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                    autoCapitalize="characters"
                  />
                  <button
                    type="button"
                    disabled={voucherLoading}
                    onClick={handleApplyVoucher}
                    className="shrink-0 rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {voucherLoading ? "Đang kiểm tra…" : "Áp dụng"}
                  </button>
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Phương thức thanh toán</h2>
              <p className="text-sm text-slate-500 mb-5">Chọn một phương thức phù hợp.</p>
              <div className="space-y-3">
                <label
                  className={[
                    "flex cursor-pointer rounded-2xl border-2 p-4 transition-all items-start gap-3",
                    paymentMethod === "cod" ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900/10" : "border-slate-200 hover:border-slate-300 bg-white",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="mt-0.5 h-4 w-4 text-slate-900 border-slate-300 focus:ring-[#CCFF00]"
                  />
                  <div>
                    <p className="font-bold text-slate-900">Thanh toán khi nhận hàng (COD)</p>
                    <p className="text-sm text-slate-600 mt-0.5">Thanh toán bằng tiền mặt hoặc thẻ khi nhận sản phẩm.</p>
                  </div>
                </label>
                <label
                  className={[
                    "flex cursor-pointer rounded-2xl border-2 p-4 transition-all items-start gap-3",
                    paymentMethod === "bank" ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900/10" : "border-slate-200 hover:border-slate-300 bg-white",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "bank"}
                    onChange={() => setPaymentMethod("bank")}
                    className="mt-0.5 h-4 w-4 text-slate-900 border-slate-300 focus:ring-[#CCFF00]"
                  />
                  <div>
                    <p className="font-bold text-slate-900">Chuyển khoản ngân hàng</p>
                    <p className="text-sm text-slate-600 mt-0.5">Nhận thông tin tài khoản sau khi đặt hàng thành công.</p>
                  </div>
                </label>
              </div>
            </section>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm lg:hidden">
              <h2 className="font-bold text-slate-900 mb-3">Đơn hàng ({items.length})</h2>
              <ul className="divide-y divide-slate-100 max-h-[240px] overflow-y-auto mini-cart-scroll">
                {items.map((li) => (
                  <li key={li.lineId} className="py-3 flex gap-3">
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
                      <p className="text-sm font-semibold text-slate-900 line-clamp-2">{li.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">×{li.quantity}</p>
                      <p className="text-sm font-bold text-rose-600 tabular-nums mt-1">{fmtPrice(li.price * li.quantity)}₫</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="w-full lg:w-[400px] shrink-0 lg:sticky lg:top-24 space-y-4">
            <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4">Đơn hàng</h2>
              <ul className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto mini-cart-scroll mb-4">
                {items.map((li) => (
                  <li key={li.lineId} className="py-3 flex gap-3">
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
                      <p className="text-sm font-semibold text-slate-900 line-clamp-2">{li.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{li.specSummary}</p>
                      <p className="text-xs text-slate-600 mt-1">SL: {li.quantity}</p>
                      <p className="text-sm font-bold text-rose-600 tabular-nums">{fmtPrice(li.price * li.quantity)}₫</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4">Tóm tắt</h2>
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
                {totals.subtotal < FREE_SHIPPING_THRESHOLD && totals.subtotal > 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5">
                    Miễn phí ship cho đơn từ {fmtPrice(FREE_SHIPPING_THRESHOLD)}₫.
                  </p>
                ) : null}
              </div>
              <div className="border-t border-slate-200 my-4" />
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-slate-800 font-semibold">Tổng cộng</span>
                <span className="text-2xl font-extrabold px-3 py-1 rounded-lg tabular-nums">{fmtPrice(totals.total)}₫</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Giá đã bao gồm VAT</p>
              <button
                type="button"
                disabled={submitting}
                onClick={completeOrder}
                className="mt-5 w-full rounded-xl bg-slate-900 text-white py-3.5 font-bold text-base hover:bg-slate-800 transition hidden lg:block disabled:opacity-60 disabled:pointer-events-none"
              >
                {submitting ? "Đang xử lý…" : "HOÀN TẤT ĐẶT HÀNG"}
              </button>
              <Link to="/thong-tin-nhan-hang" className="mt-3 hidden lg:block text-center text-sm text-slate-600 hover:text-slate-900 font-medium">
                ← Quay lại thông tin nhận hàng
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div>
          <p className="text-xs text-slate-500">Tổng</p>
          <p className="text-lg font-bold text-rose-600 tabular-nums">{fmtPrice(totals.total)}₫</p>
        </div>
        <button
          type="button"
          disabled={submitting}
          onClick={completeOrder}
          className="rounded-xl bg-[#CCFF00] text-black px-5 py-3 font-bold text-sm shrink-0 disabled:opacity-60 disabled:pointer-events-none"
        >
          {submitting ? "…" : "ĐẶT HÀNG →"}
        </button>
      </div>

      <Footer />
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} onGuestContinue={completeGuest} />
    </div>
  );
}
