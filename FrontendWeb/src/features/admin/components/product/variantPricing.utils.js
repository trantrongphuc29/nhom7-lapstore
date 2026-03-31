export const ROUNDING_OPTIONS = [
  { value: "round_nearest_1000", label: "Tròn 1.000 gần nhất" },
  { value: "round_to_990", label: "Tâm lý …990" },
  { value: "round_to_900", label: "Tâm lý …900" },
  { value: "round_up", label: "Làm tròn lên 1.000" },
  { value: "round_down", label: "Làm tròn xuống 1.000" },
  { value: "round_psychological", label: "Hậu tố tâm lý (settings)" },
];

export const DEFAULT_LOGISTICS_COST = 50000;
export const DEFAULT_OPERATIONAL_COST = 300000;
export const DEFAULT_TARGET_MARGIN_PERCENT = 8;

export function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function saleRetail(v) {
  return num(v.retailPrice != null && v.retailPrice !== "" ? v.retailPrice : v.price ?? 0);
}

export function originalNum(v) {
  return v.originalPrice === "" || v.originalPrice == null ? 0 : num(v.originalPrice, 0);
}

export function derivedDisplayDiscountPct(v) {
  const sale = saleRetail(v);
  const orig = originalNum(v);
  if (orig > 0 && orig > sale) {
    return Math.max(0, Math.min(100, Math.round(((orig - sale) / orig) * 100)));
  }
  return null;
}

export function createDefaultVariant() {
  return {
    color: "",
    ram: "",
    storage: "",
    version: "",
    price: 0,
    discount: 0,
    stock: 0,
    lowStockThreshold: 5,
    sku: "",
    importPrice: 0,
    logisticsCost: DEFAULT_LOGISTICS_COST,
    operationalCost: DEFAULT_OPERATIONAL_COST,
    targetMarginPercent: DEFAULT_TARGET_MARGIN_PERCENT,
    vatRate: 10,
    retailPrice: 0,
    roundingRule: "round_nearest_1000",
    allowLossOverride: false,
    originalPrice: 0,
  };
}
