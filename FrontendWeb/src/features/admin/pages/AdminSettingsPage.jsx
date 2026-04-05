import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../components/common/PageHeader";
import { useAuth } from "../../../context/AuthContext";
import { getPricingSettings, patchPricingSettings } from "../services/adminPricing.service";
import { getStorefrontSettings, patchStorefrontSettings } from "../services/adminStorefront.service";
import { normalizeRole } from "../utils/rbac";

const ROUNDING_OPTIONS = [
  { value: "round_nearest_1000", label: "Tròn 1.000 gần nhất" },
  { value: "round_to_990", label: "Tâm lý …990" },
  { value: "round_to_900", label: "Tâm lý …900" },
  { value: "round_up", label: "Làm tròn lên 1.000" },
  { value: "round_down", label: "Làm tròn xuống 1.000" },
  { value: "round_psychological", label: "Hậu tố tâm lý (theo ô dưới)" },
];

export default function AdminSettingsPage() {
  const { token, user } = useAuth();
  const isSuper = normalizeRole(user?.role) === "admin";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingStore, setSavingStore] = useState(false);
  const [form, setForm] = useState({
    default_vat_rate: 10,
    default_rounding_rule: "round_nearest_1000",
    psychological_suffix: 990,
  });
  const [storeForm, setStoreForm] = useState({
    default_shipping_fee: 50_000,
    free_shipping_threshold: 10_000_000,
    footer_hotline: "1900 630 680",
    footer_email: "lapstore@gmail.com",
  });

  useEffect(() => {
    if (!isSuper || !token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([getPricingSettings(token), getStorefrontSettings(token)])
      .then(([pricing, storefront]) => {
        if (cancelled) return;
        setForm((f) => ({ ...f, ...pricing }));
        setStoreForm((f) => ({ ...f, ...storefront }));
      })
      .catch(() => toast.error("Không tải được cấu hình hệ thống"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, isSuper]);

  const onSavePricing = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const next = await patchPricingSettings(
        {
          default_vat_rate: Number(form.default_vat_rate) || 10,
          default_rounding_rule: form.default_rounding_rule,
          psychological_suffix: Number(form.psychological_suffix) || 990,
        },
        token
      );
      setForm((f) => ({ ...f, ...next }));
      toast.success("Đã lưu cấu hình giá & VAT mặc định");
    } catch (err) {
      toast.error(err.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const onSaveStorefront = async (e) => {
    e.preventDefault();
    setSavingStore(true);
    try {
      const next = await patchStorefrontSettings(
        {
          default_shipping_fee: Number(storeForm.default_shipping_fee) || 0,
          free_shipping_threshold: Number(storeForm.free_shipping_threshold) || 0,
          footer_hotline: String(storeForm.footer_hotline || "").trim(),
          footer_email: String(storeForm.footer_email || "").trim(),
        },
        token
      );
      setStoreForm((f) => ({ ...f, ...next }));
      toast.success("Đã lưu cài đặt cửa hàng & vận chuyển");
    } catch (err) {
      toast.error(err.message || "Lưu thất bại");
    } finally {
      setSavingStore(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt hệ thống"
        subtitle="Cấu hình giá, vận chuyển và thông tin liên hệ hiển thị trên website."
      />

      {!isSuper ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-sm">
          Chỉ Admin chỉnh được cấu hình giá toàn hệ thống.
        </div>
      ) : null}

      {isSuper ? (
        <form onSubmit={onSavePricing} className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 max-w-lg">
          <h3 className="text-sm font-semibold text-slate-800">Giá &amp; VAT mặc định</h3>
          {loading ? <p className="text-sm text-slate-500">Đang tải…</p> : null}
          <div>
            <label className="text-xs font-medium text-slate-600">VAT % mặc định</label>
            <input
              type="number"
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              value={form.default_vat_rate}
              onChange={(e) => setForm((f) => ({ ...f, default_vat_rate: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Quy tắc làm tròn mặc định</label>
            <select
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              value={form.default_rounding_rule}
              onChange={(e) => setForm((f) => ({ ...f, default_rounding_rule: e.target.value }))}
            >
              {ROUNDING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Hậu tố tâm lý (khi chọn round_psychological)</label>
            <input
              type="number"
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              value={form.psychological_suffix}
              onChange={(e) => setForm((f) => ({ ...f, psychological_suffix: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            disabled={saving || loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Đang lưu…" : "Lưu cấu hình"}
          </button>
        </form>
      ) : null}

      {isSuper ? (
        <form onSubmit={onSaveStorefront} className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 max-w-lg">
          <h3 className="text-sm font-semibold text-slate-800">Vận chuyển</h3>
          {loading ? <p className="text-sm text-slate-500">Đang tải…</p> : null}
          <div>
            <label className="text-xs font-medium text-slate-600">Phí vận chuyển mặc định (₫, khi chưa đủ ngưỡng freeship)</label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              value={storeForm.default_shipping_fee}
              onChange={(e) => setStoreForm((f) => ({ ...f, default_shipping_fee: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Ngưỡng miễn phí vận chuyển (₫)</label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              value={storeForm.free_shipping_threshold}
              onChange={(e) => setStoreForm((f) => ({ ...f, free_shipping_threshold: e.target.value }))}
            />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 pt-2 border-t border-slate-100">Footer cửa hàng</h3>
          <div>
            <label className="text-xs font-medium text-slate-600">Hotline hiển thị</label>
            <input
              type="text"
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              value={storeForm.footer_hotline}
              onChange={(e) => setStoreForm((f) => ({ ...f, footer_hotline: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Email liên hệ hiển thị</label>
            <input
              type="email"
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
              value={storeForm.footer_email}
              onChange={(e) => setStoreForm((f) => ({ ...f, footer_email: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            disabled={savingStore || loading}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold disabled:opacity-50"
          >
            {savingStore ? "Đang lưu…" : "Lưu cài đặt cửa hàng"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
