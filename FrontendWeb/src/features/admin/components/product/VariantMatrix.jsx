import React, { useState } from "react";
import toast from "react-hot-toast";
import { postPricingPreview } from "../../services/adminPricing.service";
import { getAdminSkuSuggest } from "../../services/adminProducts.service";
import { formatVndCurrency } from "../../utils/formatters";
import { validateMoney, validatePercent, validatePositiveInt, validateSku } from "../../utils/validators";
import {
  createDefaultVariant,
  DEFAULT_LOGISTICS_COST,
  DEFAULT_OPERATIONAL_COST,
  DEFAULT_TARGET_MARGIN_PERCENT,
  derivedDisplayDiscountPct,
  num,
  ROUNDING_OPTIONS,
} from "./variantPricing.utils";

export function defaultVariant() {
  return createDefaultVariant();
}

function MarginBadge({ marginPercent, badgeClass }) {
  const m = marginPercent == null || Number.isNaN(Number(marginPercent)) ? null : Number(marginPercent);
  const cls =
    badgeClass === "danger"
      ? "bg-rose-100 text-rose-800 border-rose-200"
      : badgeClass === "warning"
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (m == null) return <span className="text-xs text-slate-400">—</span>;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      Margin {m.toFixed(2)}%
    </span>
  );
}

export default function VariantMatrix({ variants, setVariants, token, permissions = {}, productBrand = "", productId }) {
  const [loadingIdx, setLoadingIdx] = useState(null);
  const [suggestingIdx, setSuggestingIdx] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const canCost = Boolean(permissions.canViewCostAndImport);
  const canEditCost = Boolean(permissions.canEditCostAndImport);
  const canProfit = Boolean(permissions.canViewProfit);

  const setErr = (idx, key, msg) => {
    setFieldErrors((prev) => ({
      ...(prev || {}),
      [idx]: { ...((prev || {})[idx] || {}), [key]: msg || "" },
    }));
  };

  const clearErr = (idx, key) => {
    setFieldErrors((prev) => {
      if (!prev?.[idx]?.[key]) return prev;
      return { ...prev, [idx]: { ...(prev[idx] || {}), [key]: "" } };
    });
  };

  const updateItem = (index, key, value) => {
    const next = [...variants];
    next[index] = { ...next[index], [key]: value };
    setVariants(next);
    clearErr(index, key);
  };

  /** Một lần setState để tránh ghi đè khi cập nhật nhiều field (vd. retailPrice + price). */
  const updateItems = (index, patch) => {
    const next = [...variants];
    next[index] = { ...next[index], ...patch };
    setVariants(next);
    Object.keys(patch).forEach((k) => clearErr(index, k));
  };

  const validateRow = (idx, { forPreview = false } = {}) => {
    const v = variants[idx] || {};
    let ok = true;

    const skuErr = validateSku(v.sku);
    if (skuErr) {
      setErr(idx, "sku", skuErr);
      ok = false;
    }

    const stockErr = validatePositiveInt(v.stock ?? 0, { min: 0 });
    if (stockErr) {
      setErr(idx, "stock", stockErr);
      ok = false;
    }

    const lowStockErr = validatePositiveInt(v.lowStockThreshold ?? 0, { min: 0 });
    if (lowStockErr) {
      setErr(idx, "lowStockThreshold", lowStockErr);
      ok = false;
    }

    const vatErr = validatePercent(v.vatRate ?? 10, { min: 0, max: 100 });
    if (vatErr) {
      setErr(idx, "vatRate", vatErr);
      ok = false;
    }

    const retailValue = v.retailPrice != null && v.retailPrice !== "" ? v.retailPrice : v.price ?? 0;
    const retailErr = validateMoney(retailValue, { min: 0 });
    if (retailErr) {
      setErr(idx, "retailPrice", retailErr);
      ok = false;
    }

    const origMoneyErr = validateMoney(v.originalPrice ?? 0, { min: 0 });
    if (origMoneyErr) {
      setErr(idx, "originalPrice", origMoneyErr);
      ok = false;
    } else {
      const sale = num(v.retailPrice != null && v.retailPrice !== "" ? v.retailPrice : v.price ?? 0);
      const orig = v.originalPrice === "" || v.originalPrice == null ? 0 : num(v.originalPrice);
      if (orig > 0 && orig <= sale) {
        setErr(idx, "originalPrice", "Giá gốc phải lớn hơn giá bán lẻ để hiển thị gạch ngang");
        ok = false;
      }
    }

    if (derivedDisplayDiscountPct(v) === null) {
      const discountErr = validatePercent(v.discount ?? 0, { min: 0, max: 100 });
      if (discountErr) {
        setErr(idx, "discount", discountErr);
        ok = false;
      }
    }

    if (canCost) {
      const importErr = validateMoney(v.importPrice ?? 0, { min: 0 });
      if (importErr) {
        setErr(idx, "importPrice", importErr);
        ok = false;
      }

      const logisticsErr = validateMoney(v.logisticsCost ?? 0, { min: 0 });
      if (logisticsErr) {
        setErr(idx, "logisticsCost", logisticsErr);
        ok = false;
      }

      const operationalErr = validateMoney(v.operationalCost ?? 0, { min: 0 });
      if (operationalErr) {
        setErr(idx, "operationalCost", operationalErr);
        ok = false;
      }

      const marginErr =
        v.targetMarginPercent === "" || v.targetMarginPercent == null ? "" : validatePercent(v.targetMarginPercent, { min: 0, max: 100 });
      if (marginErr) {
        setErr(idx, "targetMarginPercent", marginErr);
        ok = false;
      }
    }

    if (!ok && forPreview) toast.error("Dòng giá chưa hợp lệ (vui lòng kiểm tra ô đang đỏ).");
    return ok;
  };

  const applySuggestedSku = async (index) => {
    if (!token) {
      toast.error("Cần đăng nhập admin để gợi ý SKU");
      return;
    }
    const v = variants[index] || {};
    setSuggestingIdx(index);
    try {
      const data = await getAdminSkuSuggest(
        {
          brand: productBrand || "",
          version: v.version || "",
          ram: v.ram || "",
          storage: v.storage || "",
          color: v.color || "",
          productId: productId != null ? String(productId) : "",
          variantId: v.id != null ? String(v.id) : "",
        },
        token
      );
      if (data.sku) {
        updateItem(index, "sku", data.sku);
        toast.success("Đã điền SKU gợi ý (có thể chỉnh tay)");
      }
    } catch (e) {
      toast.error(e.message || "Không tạo được SKU gợi ý");
    } finally {
      setSuggestingIdx(null);
    }
  };

  const applyPreviewToRow = async (index) => {
    const v = variants[index];
    if (!token) return;
    if (!validateRow(index, { forPreview: true })) return;
    setLoadingIdx(index);
    try {
      const marginNum = v.targetMarginPercent === "" || v.targetMarginPercent == null ? 0 : num(v.targetMarginPercent);
      const useMarginPricing = marginNum > 0;
      const body = {
        import_price: num(v.importPrice),
        logistics_cost: num(v.logisticsCost),
        operational_cost: num(v.operationalCost),
        vat_rate: (() => {
          const raw = v.vatRate;
          if (raw === 0 || raw === "0") return 0;
          if (raw === "" || raw == null) return 10;
          const vr = num(raw);
          return Number.isFinite(vr) ? vr : 10;
        })(),
        target_margin_percent: v.targetMarginPercent === "" || v.targetMarginPercent == null ? null : num(v.targetMarginPercent),
        /** Có % margin mục tiêu → không gửi giá lẻ cũ để backend tính từ vốn + margin; không thì giữ nhập tay để chỉ làm tròn. */
        retail_price: useMarginPricing ? null : num(v.retailPrice) > 0 ? num(v.retailPrice) : null,
        rounding_rule: v.roundingRule || "round_nearest_1000",
        allow_loss_override: Boolean(v.allowLossOverride),
      };
      const fin = await postPricingPreview(body, token);
      const next = [...variants];
      const retail = num(fin.retail_price ?? fin.retailPrice);
      next[index] = {
        ...next[index],
        retailPrice: retail,
        price: num(fin.price ?? fin.retail_price) || retail,
        vatRate: fin.vat_rate != null ? Number(fin.vat_rate) : next[index].vatRate,
        vatAmount: fin.vat_amount != null ? Number(fin.vat_amount) : 0,
        marginPercent: fin.margin_percent != null ? Number(fin.margin_percent) : null,
        profitAmount: fin.profit_amount != null ? Number(fin.profit_amount) : null,
        costPrice: fin.cost_price != null ? Number(fin.cost_price) : null,
        priceBeforeTax: fin.price_before_tax != null ? Number(fin.price_before_tax) : retail,
        importPrice: fin.import_price != null ? Number(fin.import_price) : next[index].importPrice,
        logisticsCost: fin.logistics_cost != null ? Number(fin.logistics_cost) : next[index].logisticsCost,
        operationalCost: fin.operational_cost != null ? Number(fin.operational_cost) : next[index].operationalCost,
        marginBadgeClass: retail > 0 && fin.margin_percent != null
          ? num(fin.margin_percent) < 5
            ? "danger"
            : num(fin.margin_percent) <= 15
              ? "warning"
              : "success"
          : next[index].marginBadgeClass,
      };
      setVariants(next);
      toast.success("Đã cập nhật giá theo margin / VAT / làm tròn");
    } catch (e) {
      toast.error(e.message || "Không tính được giá");
    } finally {
      setLoadingIdx(null);
    }
  };

  const addVariant = () => {
    setVariants([...variants, defaultVariant()]);
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Phiên bản &amp; giá</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            <span className="font-medium text-slate-700">Giá bán lẻ</span> là giá cuối trên trang chi tiết (đã gồm VAT nội bộ).{" "}
            <span className="font-medium text-slate-700">Giá gốc</span> (nếu có) hiển thị gạch ngang để so sánh. Nhập vốn + % margin rồi bấm{" "}
            <span className="font-medium text-slate-700">Tính giá</span> để làm tròn.
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Quy tắc nhập: số tiền ≥ 0, VAT 0–100, % margin 0–100.{" "}
            <span className="font-medium text-slate-700">SKU phiên bản</span> bắt buộc, duy nhất — gợi ý chuẩn 10 ký tự (vd.{" "}
            <span className="font-mono">X1CG9037NU</span>): dòng + CPU/Gen + mã cấu hình + màu.
          </p>
        </div>
        <button
          type="button"
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 shrink-0 bg-white hover:bg-slate-50"
          onClick={addVariant}
        >
          + Thêm phiên bản
        </button>
      </div>

      <div className="space-y-4">
        {variants.map((v, idx) => {
          const displayDer = derivedDisplayDiscountPct(v);
          return (
          <div
            key={v.id ?? `new-${idx}`}
            className="border border-slate-100 rounded-xl p-3 sm:p-4 bg-slate-50/80 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-600">Phiên bản #{idx + 1}</p>
              <div className="flex flex-wrap items-center gap-2">
                {canProfit ? <MarginBadge marginPercent={v.marginPercent} badgeClass={v.marginBadgeClass} /> : null}
                <button type="button" className="text-rose-600 text-xs font-medium" onClick={() => removeVariant(idx)}>
                  Xóa dòng
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <input
                className="border rounded-lg px-2 py-1.5 text-sm bg-white"
                placeholder="Màu"
                value={v.color}
                onChange={(e) => updateItem(idx, "color", e.target.value)}
              />
              <input
                className="border rounded-lg px-2 py-1.5 text-sm bg-white"
                placeholder="RAM"
                value={v.ram}
                onChange={(e) => updateItem(idx, "ram", e.target.value)}
              />
              <input
                className="border rounded-lg px-2 py-1.5 text-sm bg-white"
                placeholder="SSD"
                value={v.storage}
                onChange={(e) => updateItem(idx, "storage", e.target.value)}
              />
              <input
                className="border rounded-lg px-2 py-1.5 text-sm bg-white sm:col-span-2 lg:col-span-3"
                placeholder="CPU / phiên bản (bắt buộc)"
                value={v.version || ""}
                onChange={(e) => updateItem(idx, "version", e.target.value)}
              />
              <div className="min-w-0 sm:col-span-2 lg:col-span-2">
                <label className="text-[11px] font-medium text-slate-600">SKU phiên bản (bắt buộc)</label>
                <div className="mt-0.5 flex flex-col sm:flex-row gap-1.5">
                  <input
                    className={`border rounded-lg px-2 py-1.5 text-sm bg-white w-full font-mono min-w-0 ${fieldErrors?.[idx]?.sku ? "border-rose-400" : ""}`}
                    placeholder="VD: X1CG9037NU"
                    value={v.sku || ""}
                    onChange={(e) => updateItem(idx, "sku", e.target.value)}
                    onBlur={() => setErr(idx, "sku", validateSku(v.sku))}
                  />
                  <button
                    type="button"
                    disabled={suggestingIdx === idx}
                    onClick={() => applySuggestedSku(idx)}
                    className="shrink-0 text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 whitespace-nowrap"
                  >
                    {suggestingIdx === idx ? "Đang tạo…" : "Gợi ý SKU"}
                  </button>
                </div>
                {fieldErrors?.[idx]?.sku ? <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors[idx].sku}</p> : null}
              </div>
              <div>
                {idx === 0 ? <p className="text-[11px] text-slate-500 mb-1">Gợi ý: nhập số lượng tồn hiện tại của phiên bản này.</p> : null}
                <input
                  className={`border rounded-lg px-2 py-1.5 text-sm bg-white w-full ${fieldErrors?.[idx]?.stock ? "border-rose-400" : ""}`}
                  placeholder="Tồn kho"
                  type="number"
                  min={0}
                  value={v.stock}
                  onChange={(e) => updateItem(idx, "stock", Number(e.target.value || 0))}
                  onBlur={() => setErr(idx, "stock", validatePositiveInt(v.stock ?? 0, { min: 0 }))}
                />
                {fieldErrors?.[idx]?.stock ? <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors[idx].stock}</p> : null}
              </div>
              <div>
                {idx === 0 ? <p className="text-[11px] text-slate-500 mb-1">Gợi ý: mức tồn kho tối thiểu để cảnh báo sắp hết hàng.</p> : null}
                <input
                  className={`border rounded-lg px-2 py-1.5 text-sm bg-white w-full ${
                    fieldErrors?.[idx]?.lowStockThreshold ? "border-rose-400" : ""
                  }`}
                  placeholder="Ngưỡng cảnh báo"
                  type="number"
                  min={0}
                  value={v.lowStockThreshold ?? 5}
                  onChange={(e) => updateItem(idx, "lowStockThreshold", Number(e.target.value || 0))}
                  onBlur={() => setErr(idx, "lowStockThreshold", validatePositiveInt(v.lowStockThreshold ?? 0, { min: 0 }))}
                />
                {fieldErrors?.[idx]?.lowStockThreshold ? (
                  <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors[idx].lowStockThreshold}</p>
                ) : null}
              </div>
            </div>

            {canCost ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600">Giá nhập</label>
                  <input
                    disabled={!canEditCost}
                    className={`mt-0.5 w-full border rounded-lg px-2 py-1.5 text-sm bg-white disabled:bg-slate-100 ${
                      fieldErrors?.[idx]?.importPrice ? "border-rose-400" : ""
                    }`}
                    type="number"
                    min={0}
                    value={v.importPrice ?? ""}
                    onChange={(e) => updateItem(idx, "importPrice", e.target.value === "" ? "" : Number(e.target.value))}
                    onBlur={() => setErr(idx, "importPrice", validateMoney(v.importPrice ?? 0, { min: 0 }))}
                  />
                  {fieldErrors?.[idx]?.importPrice ? <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors[idx].importPrice}</p> : null}
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600">Chi phí vận chuyển</label>
                  <input
                    disabled={!canEditCost}
                    className={`mt-0.5 w-full border rounded-lg px-2 py-1.5 text-sm bg-white disabled:bg-slate-100 ${
                      fieldErrors?.[idx]?.logisticsCost ? "border-rose-400" : ""
                    }`}
                    type="number"
                    min={0}
                    value={v.logisticsCost === "" || v.logisticsCost == null ? DEFAULT_LOGISTICS_COST : v.logisticsCost}
                    onChange={(e) => updateItem(idx, "logisticsCost", e.target.value === "" ? "" : Number(e.target.value))}
                    onBlur={() => {
                      if (v.logisticsCost === "" || v.logisticsCost == null) {
                        updateItem(idx, "logisticsCost", DEFAULT_LOGISTICS_COST);
                        return;
                      }
                      setErr(idx, "logisticsCost", validateMoney(v.logisticsCost ?? 0, { min: 0 }));
                    }}
                  />
                  {fieldErrors?.[idx]?.logisticsCost ? (
                    <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors[idx].logisticsCost}</p>
                  ) : null}
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600">Chi phí vận hành</label>
                  <input
                    disabled={!canEditCost}
                    className={`mt-0.5 w-full border rounded-lg px-2 py-1.5 text-sm bg-white disabled:bg-slate-100 ${
                      fieldErrors?.[idx]?.operationalCost ? "border-rose-400" : ""
                    }`}
                    type="number"
                    min={0}
                    value={v.operationalCost === "" || v.operationalCost == null ? DEFAULT_OPERATIONAL_COST : v.operationalCost}
                    onChange={(e) => updateItem(idx, "operationalCost", e.target.value === "" ? "" : Number(e.target.value))}
                    onBlur={() => {
                      if (v.operationalCost === "" || v.operationalCost == null) {
                        updateItem(idx, "operationalCost", DEFAULT_OPERATIONAL_COST);
                        return;
                      }
                      setErr(idx, "operationalCost", validateMoney(v.operationalCost ?? 0, { min: 0 }));
                    }}
                  />
                  {fieldErrors?.[idx]?.operationalCost ? (
                    <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors[idx].operationalCost}</p>
                  ) : null}
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600">% Margin mục tiêu (trên vốn)</label>
                  <input
                    disabled={!canEditCost}
                    className={`mt-0.5 w-full border rounded-lg px-2 py-1.5 text-sm bg-white disabled:bg-slate-100 ${
                      fieldErrors?.[idx]?.targetMarginPercent ? "border-rose-400" : ""
                    }`}
                    type="number"
                    min={0}
                    max={100}
                    value={
                      v.targetMarginPercent === "" || v.targetMarginPercent == null
                        ? DEFAULT_TARGET_MARGIN_PERCENT
                        : v.targetMarginPercent
                    }
                    onChange={(e) => updateItem(idx, "targetMarginPercent", e.target.value === "" ? "" : Number(e.target.value))}
                    onBlur={() =>
                      {
                        if (v.targetMarginPercent === "" || v.targetMarginPercent == null) {
                          updateItem(idx, "targetMarginPercent", DEFAULT_TARGET_MARGIN_PERCENT);
                          return;
                        }
                        setErr(
                          idx,
                          "targetMarginPercent",
                          validatePercent(v.targetMarginPercent, { min: 0, max: 100 })
                        );
                      }
                    }
                  />
                  {fieldErrors?.[idx]?.targetMarginPercent ? (
                    <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors[idx].targetMarginPercent}</p>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-0.5">Để trống nếu muốn nhập giá bán lẻ thủ công</p>
                  )}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-600">VAT % (tách nội bộ)</label>
                <input
                  className={`mt-0.5 w-full border rounded-lg px-2 py-1.5 text-sm bg-white ${fieldErrors?.[idx]?.vatRate ? "border-rose-400" : ""}`}
                  type="number"
                  min={0}
                  max={100}
                  value={v.vatRate !== undefined && v.vatRate !== null && v.vatRate !== "" ? Number(v.vatRate) : 10}
                  onChange={(e) => updateItem(idx, "vatRate", Number(e.target.value || 0))}
                  onBlur={() =>
                    setErr(
                      idx,
                      "vatRate",
                      validatePercent(v.vatRate !== undefined && v.vatRate !== null && v.vatRate !== "" ? v.vatRate : 10, {
                        min: 0,
                        max: 100,
                      })
                    )
                  }
                />
                {fieldErrors?.[idx]?.vatRate ? <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors[idx].vatRate}</p> : null}
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600">Quy tắc làm tròn</label>
                <select
                  className="mt-0.5 w-full border rounded-lg px-2 py-1.5 text-sm bg-white"
                  value={v.roundingRule || "round_nearest_1000"}
                  onChange={(e) => updateItem(idx, "roundingRule", e.target.value)}
                  disabled={!canEditCost}
                >
                  {ROUNDING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600">Giá bán lẻ (giá bán cuối)</label>
                <input
                  className={`mt-0.5 w-full border rounded-lg px-2 py-1.5 text-sm bg-white font-medium ${
                    fieldErrors?.[idx]?.retailPrice ? "border-rose-400" : ""
                  }`}
                  type="number"
                  min={0}
                  value={v.retailPrice != null && v.retailPrice !== "" ? v.retailPrice : v.price ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const n = raw === "" ? 0 : Number(raw);
                    updateItems(idx, { retailPrice: n, price: n });
                  }}
                  onBlur={() => setErr(idx, "retailPrice", validateMoney(v.retailPrice ?? v.price ?? 0, { min: 0 }))}
                />
                {fieldErrors?.[idx]?.retailPrice ? <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors[idx].retailPrice}</p> : null}
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600">Giá gốc (giá gạch ngang)</label>
                <input
                  className={`mt-0.5 w-full border rounded-lg px-2 py-1.5 text-sm bg-white ${
                    fieldErrors?.[idx]?.originalPrice ? "border-rose-400" : ""
                  }`}
                  type="number"
                  min={0}
                  value={v.originalPrice === "" || v.originalPrice == null ? 0 : Number(v.originalPrice)}
                  onChange={(e) => updateItem(idx, "originalPrice", Number(e.target.value || 0))}
                  onBlur={() =>
                    setErr(idx, "originalPrice", validateMoney(v.originalPrice ?? 0, { min: 0 }))
                  }
                />
                {fieldErrors?.[idx]?.originalPrice ? (
                  <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors[idx].originalPrice}</p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-0.5">Nhập 0 nếu không cần gạch ngang</p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600">Giảm giá hiển thị (%)</label>
                {displayDer != null ? (
                  <>
                    <div className="mt-0.5 w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-slate-100 text-slate-800 font-semibold tabular-nums">
                      {displayDer}%
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Khớp trang chi tiết: (giá gốc − giá bán) / giá gốc</p>
                  </>
                ) : (
                  <>
                    <input
                      className={`mt-0.5 w-full border rounded-lg px-2 py-1.5 text-sm bg-white ${
                        fieldErrors?.[idx]?.discount ? "border-rose-400" : ""
                      }`}
                      type="number"
                      min={0}
                      max={100}
                      value={v.discount ?? 0}
                      onChange={(e) => updateItem(idx, "discount", Number(e.target.value || 0))}
                      onBlur={() => setErr(idx, "discount", validatePercent(v.discount ?? 0, { min: 0, max: 100 }))}
                    />
                    {fieldErrors?.[idx]?.discount ? (
                      <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors[idx].discount}</p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-0.5">Khi không có giá gốc &gt; giá bán — badge trên card / chi tiết</p>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={Boolean(v.allowLossOverride)}
                    onChange={(e) => updateItem(idx, "allowLossOverride", e.target.checked)}
                    disabled={!canEditCost}
                  />
                  <span className="text-xs text-slate-700">Cho phép bán lỗ (override)</span>
                </label>
              </div>
            </div>

            {canEditCost ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={loadingIdx === idx}
                  onClick={() => applyPreviewToRow(idx)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50"
                >
                  {loadingIdx === idx ? "Đang tính…" : "Tính giá (margin + VAT + làm tròn)"}
                </button>
              </div>
            ) : null}

            {canProfit ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-slate-700">
                <p>
                  <span className="text-slate-500">Giá vốn: </span>
                  {formatVndCurrency(v.costPrice ?? 0)}
                </p>
                <p>
                  <span className="text-slate-500">Tiền VAT nội bộ: </span>
                  {formatVndCurrency(v.vatAmount ?? 0)}
                </p>
                <p>
                  <span className="text-slate-500">Lợi nhuận ước tính: </span>
                  {formatVndCurrency(v.profitAmount ?? 0)}
                </p>
                <p>
                  <span className="text-slate-500">Giá niêm yết (= bán lẻ): </span>
                  {formatVndCurrency(v.priceBeforeTax ?? v.retailPrice ?? v.price ?? 0)}
                </p>
              </div>
            ) : null}
          </div>
          );
        })}
        {variants.length === 0 ? (
          <p className="text-xs text-slate-500">Chưa có phiên bản. Thêm ít nhất một dòng để có giá bán trên website.</p>
        ) : null}
      </div>
    </div>
  );
}
