import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../components/common/PageHeader";
import { useAuth } from "../../../context/AuthContext";
import { getPricingSettings, patchPricingSettings } from "../services/adminPricing.service";
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
  const [form, setForm] = useState({
    default_vat_rate: 10,
    default_rounding_rule: "round_nearest_1000",
    psychological_suffix: 990,
  });

  useEffect(() => {
    if (!isSuper || !token) {
      setLoading(false);
      return;
    }
    getPricingSettings(token)
      .then((data) => {
        setForm((f) => ({ ...f, ...data }));
      })
      .catch(() => toast.error("Không tải được cấu hình giá"))
      .finally(() => setLoading(false));
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

  return (
    <div className="space-y-6">
      <PageHeader title="Cài đặt hệ thống" subtitle="Cấu hình mặc định cho tính giá và VAT (áp dụng khi tạo phiên bản mới)." />

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

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-sm text-slate-600">
        <p className="font-medium text-slate-800">Các nhóm cài đặt khác</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Email / thông báo</li>
          <li>Tham số đơn hàng và vận chuyển</li>
          <li>Bảo mật và phiên đăng nhập</li>
        </ul>
      </div>
    </div>
  );
}
