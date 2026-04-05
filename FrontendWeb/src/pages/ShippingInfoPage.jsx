import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { API_ENDPOINTS, BACKEND_BASE_URL } from "../config/api";
import { useCart } from "../context/CartContext";
import { useStoreConfig } from "../context/StoreConfigContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fmtPrice } from "../utils/format";
import LoginModal from "../components/cart/LoginModal";
import CheckoutProgress from "../components/cart/CheckoutProgress";
import ProvincePickerModal from "../components/cart/ProvincePickerModal";
import { PICKUP_STORES, saveShippingDraft, loadShippingDraft } from "../utils/checkoutFlow";

function RadioCard({ name, value, checked, onChange, title, description, children }) {
  return (
    <label
      className={[
        "flex cursor-pointer rounded-2xl border-2 p-4 transition-all",
        checked ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900/10" : "border-slate-200 hover:border-slate-300 bg-white",
      ].join(" ")}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="mt-1 h-4 w-4 text-slate-900 border-slate-300 focus:ring-[#CCFF00]" />
      <div className="ml-3 flex-1 min-w-0">
        <p className="font-bold text-slate-900">{title}</p>
        {description ? <p className="text-sm text-slate-600 mt-0.5">{description}</p> : null}
        {checked && children ? <div className="mt-4 space-y-3">{children}</div> : null}
      </div>
    </label>
  );
}

export default function ShippingInfoPage() {
  const { freeShippingThreshold } = useStoreConfig();
  const { items, totals, allInStock } = useCart();
  const { isAuthenticated, token, user } = useAuth();
  const { error: toastError } = useToast();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showProvincePicker, setShowProvincePicker] = useState(false);

  const [fulfillment, setFulfillment] = useState("pickup");
  const [pickupStoreId, setPickupStoreId] = useState(PICKUP_STORES[0]?.id ?? "");
  const [pickupName, setPickupName] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");
  const [shipName, setShipName] = useState("");
  const [shipPhone, setShipPhone] = useState("");
  const [shipRegion, setShipRegion] = useState("");
  const [shipAddress, setShipAddress] = useState("");
  const [prefilledFromAccount, setPrefilledFromAccount] = useState(false);
  const [hadDraft, setHadDraft] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate("/gio-hang", { replace: true });
      return;
    }
    const draft = loadShippingDraft();
    if (draft?.fulfillment) {
      setHadDraft(true);
      setFulfillment(draft.fulfillment);
      if (draft.pickupStoreId) setPickupStoreId(draft.pickupStoreId);
      if (draft.pickupName != null) setPickupName(draft.pickupName);
      if (draft.pickupPhone != null) setPickupPhone(draft.pickupPhone);
      if (draft.shipName != null) setShipName(draft.shipName);
      if (draft.shipPhone != null) setShipPhone(draft.shipPhone);
      if (draft.shipRegion) setShipRegion(draft.shipRegion);
      if (draft.shipAddress != null) setShipAddress(draft.shipAddress);
    }
  }, [items.length, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !token || prefilledFromAccount) return;
    let cancelled = false;
    (async () => {
      try {
        const [profileRes, addrRes] = await Promise.all([
          fetch(API_ENDPOINTS.ACCOUNT_PROFILE, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(API_ENDPOINTS.ACCOUNT_ADDRESSES, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const profileJson = await profileRes.json().catch(() => ({}));
        const addrJson = await addrRes.json().catch(() => ({}));
        if (cancelled) return;
        const profile = profileJson?.data || profileJson || {};
        const addresses = addrJson?.data || addrJson || [];
        const rows = Array.isArray(addresses) ? addresses : [];
        const defaultAddress = rows.find((a) => Boolean(a?.isDefault)) || rows[0] || null;

        if (!pickupName.trim()) setPickupName((profile.fullName || user?.fullName || "").trim());
        if (!pickupPhone.trim()) setPickupPhone((profile.phone || user?.phone || "").trim());
        if (!shipName.trim()) setShipName((profile.fullName || user?.fullName || "").trim());
        if (!shipPhone.trim()) setShipPhone((profile.phone || user?.phone || "").trim());

        if (defaultAddress) {
          if (!shipRegion.trim()) setShipRegion(defaultAddress.province || "");
          if (!shipAddress.trim()) {
            const full = [defaultAddress.line1, defaultAddress.line2, defaultAddress.ward, defaultAddress.district]
              .filter(Boolean)
              .join(", ");
            setShipAddress(full);
          }
          if (!hadDraft) setFulfillment("delivery");
        }
      } finally {
        if (!cancelled) setPrefilledFromAccount(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    token,
    user,
    prefilledFromAccount,
    pickupName,
    pickupPhone,
    shipName,
    shipPhone,
    shipRegion,
    shipAddress,
    hadDraft,
  ]);

  const imgSrc = (url) =>
    url ? (url.startsWith("http") ? url : `${BACKEND_BASE_URL}/${url}`) : null;

  const validate = () => {
    if (fulfillment === "pickup") {
      if (!pickupStoreId) {
        toastError("Vui lòng chọn cửa hàng.");
        return false;
      }
      if (!pickupName.trim()) {
        toastError("Vui lòng nhập họ tên người nhận.");
        return false;
      }
      if (!pickupPhone.trim() || pickupPhone.replace(/\D/g, "").length < 9) {
        toastError("Vui lòng nhập số điện thoại hợp lệ.");
        return false;
      }
    } else {
      if (!shipName.trim()) {
        toastError("Vui lòng nhập họ tên người nhận.");
        return false;
      }
      if (!shipPhone.trim() || shipPhone.replace(/\D/g, "").length < 9) {
        toastError("Vui lòng nhập số điện thoại hợp lệ.");
        return false;
      }
      if (!shipRegion.trim()) {
        toastError("Vui lòng chọn tỉnh / thành phố.");
        return false;
      }
      if (!shipAddress.trim()) {
        toastError("Vui lòng nhập địa chỉ nhận hàng.");
        return false;
      }
    }
    return true;
  };

  const buildPayload = () => ({
    fulfillment,
    pickupStoreId: fulfillment === "pickup" ? pickupStoreId : undefined,
    pickupName: fulfillment === "pickup" ? pickupName.trim() : undefined,
    pickupPhone: fulfillment === "pickup" ? pickupPhone.trim() : undefined,
    shipName: fulfillment === "delivery" ? shipName.trim() : undefined,
    shipPhone: fulfillment === "delivery" ? shipPhone.trim() : undefined,
    shipRegion: fulfillment === "delivery" ? shipRegion.trim() : undefined,
    shipAddress: fulfillment === "delivery" ? shipAddress.trim() : undefined,
  });

  const continueToPayment = () => {
    if (items.length === 0) return;
    if (!allInStock) {
      toastError("Sản phẩm đã hết hàng");
      return;
    }
    if (!validate()) return;
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    const payload = buildPayload();
    saveShippingDraft(payload);
    navigate("/thanh-toan", { state: { shipping: payload } });
  };

  const continueGuest = () => {
    if (!validate()) return;
    const payload = buildPayload();
    saveShippingDraft(payload);
    navigate("/thanh-toan", { state: { shipping: payload } });
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-50 font-display text-slate-900 min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full pb-32 lg:pb-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Thông tin nhận hàng</h1>
        <p className="text-sm text-slate-600 mb-6">Chọn hình thức nhận hàng và điền thông tin liên hệ.</p>

        <CheckoutProgress current="shipping" />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 w-full min-w-0 space-y-6">
            <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Phương thức nhận hàng</h2>
              <div className="space-y-3">
                <RadioCard
                  name="fulfillment"
                  value="pickup"
                  checked={fulfillment === "pickup"}
                  onChange={setFulfillment}
                  title="Nhận tại cửa hàng"
                  description="Đến cửa hàng LAPSTORE để nhận máy."
                >
                  <label className="block text-sm">
                    <span className="text-slate-600 font-medium">Chọn cửa hàng</span>
                    <select
                      value={pickupStoreId}
                      onChange={(e) => setPickupStoreId(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00] bg-white"
                    >
                      {PICKUP_STORES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </RadioCard>

                <RadioCard
                  name="fulfillment"
                  value="delivery"
                  checked={fulfillment === "delivery"}
                  onChange={setFulfillment}
                  title="Giao tận nơi"
                  description="LAPSTORE giao hàng tận nhà theo địa chỉ bạn cung cấp bên dưới."
                />
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Thông tin người nhận</h2>
              <p className="text-sm text-slate-500 mb-6">Thông tin liên hệ khi nhận hàng.</p>

              {fulfillment === "pickup" ? (
                <div className="space-y-4">
                  <label className="block text-sm">
                    <span className="text-slate-600 font-medium">Họ và tên</span>
                    <input
                      value={pickupName}
                      onChange={(e) => setPickupName(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                      placeholder="Nguyễn Văn A"
                      autoComplete="name"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-600 font-medium">Số điện thoại</span>
                    <input
                      value={pickupPhone}
                      onChange={(e) => setPickupPhone(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                      placeholder="09xx xxx xxx"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block text-sm">
                    <span className="text-slate-600 font-medium">Họ và tên người nhận</span>
                    <input
                      value={shipName}
                      onChange={(e) => setShipName(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                      placeholder="Nguyễn Văn A"
                      autoComplete="name"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-600 font-medium">Số điện thoại</span>
                    <input
                      value={shipPhone}
                      onChange={(e) => setShipPhone(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                      placeholder="09xx xxx xxx"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </label>
                  <div className="block text-sm">
                    <span className="text-slate-600 font-medium">Tỉnh / thành phố</span>
                    <button
                      type="button"
                      onClick={() => setShowProvincePicker(true)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00] bg-white flex items-center justify-between gap-2 text-left"
                    >
                      <span className={shipRegion ? "text-slate-900 font-medium" : "text-slate-400"}>
                        {shipRegion || "Chọn tỉnh / thành phố"}
                      </span>
                      <span className="material-symbols-outlined text-slate-500 shrink-0">expand_more</span>
                    </button>
                  </div>
                  <label className="block text-sm">
                    <span className="text-slate-600 font-medium">Địa chỉ nhận hàng</span>
                    <textarea
                      value={shipAddress}
                      onChange={(e) => setShipAddress(e.target.value)}
                      rows={3}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00] resize-y"
                      placeholder="Số nhà, đường, phường/xã, quận/huyện"
                    />
                  </label>
                </div>
              )}
            </section>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm lg:hidden">
              <h2 className="font-bold text-slate-900 mb-3">Đơn hàng ({items.length})</h2>
              <ul className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto mini-cart-scroll">
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

            <div className="pb-2 lg:pb-0">
              <Link to="/gio-hang" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                ← Quay lại giỏ hàng
              </Link>
            </div>
          </div>

          <aside className="w-full lg:w-[400px] shrink-0 lg:sticky lg:top-24 space-y-4">
            <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4">Đơn hàng ({items.length})</h2>
              <ul className="divide-y divide-slate-100 max-h-[280px] overflow-y-auto mini-cart-scroll mb-4">
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
                    {totals.shippingFee === 0 ? <span className="text-emerald-600 font-bold">Miễn phí</span> : `${fmtPrice(totals.shippingFee)}₫`}
                  </span>
                </div>
                {totals.subtotal < freeShippingThreshold && totals.subtotal > 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5">
                    Mua thêm {fmtPrice(freeShippingThreshold - totals.subtotal)}₫ để được miễn phí vận chuyển.
                  </p>
                ) : totals.shippingFee === 0 && totals.subtotal >= freeShippingThreshold ? (
                  <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1.5">Đơn hàng đủ điều kiện miễn phí vận chuyển.</p>
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
                onClick={continueToPayment}
                className="mt-5 w-full rounded-xl bg-slate-900 text-white py-3.5 font-bold text-base hover:bg-slate-800 transition hidden lg:block"
              >
                Tiếp tục thanh toán
              </button>
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
          onClick={continueToPayment}
          className="rounded-xl bg-[#CCFF00] text-black px-5 py-3 font-bold text-sm shrink-0"
        >
          Tiếp tục →
        </button>
      </div>

      <Footer />
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} onGuestContinue={continueGuest} />
      <ProvincePickerModal
        open={showProvincePicker}
        onClose={() => setShowProvincePicker(false)}
        currentValue={shipRegion}
        onSelect={setShipRegion}
      />
    </div>
  );
}
