import { validateMoney, validatePercent, validatePositiveInt, validateSku } from "./validators";

export function isBlank(v) {
  return v === null || v === undefined || String(v).trim() === "";
}

/** Rich text Quill: không chỉ còn thẻ rỗng. */
export function htmlHasText(html) {
  const t = String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > 0;
}

const SPEC_LABELS = {
  cpu: "CPU",
  gpuOnboard: "GPU tích hợp",
  gpuDiscrete: "GPU rời",
  ram: "RAM (thông số chung)",
  ramMax: "RAM tối đa",
  storage: "Ổ cứng (thông số chung)",
  storageMax: "Ổ tối đa",
  screenSize: "Kích thước màn hình",
  screenResolution: "Độ phân giải",
  screenTechnology: "Công nghệ màn hình",
  ports: "Cổng kết nối",
  battery: "Pin",
  dimensions: "Kích thước máy",
  weight: "Trọng lượng",
  material: "Chất liệu",
  wireless: "Kết nối không dây",
  webcam: "Webcam",
  os: "Hệ điều hành",
};

/** Chỉ bắt buộc: CPU, GPU tích hợp, RAM chung, ổ cứng mặc định. Còn lại để trống = không có. */
const REQUIRED_SPEC_KEYS = ["cpu", "gpuOnboard", "ram", "storage"];

export function validateSpecsComplete(specs) {
  if (!specs || typeof specs !== "object") return "Thiếu thông số kỹ thuật";
  for (const key of REQUIRED_SPEC_KEYS) {
    if (isBlank(specs[key])) {
      return `Thông số kỹ thuật — ${SPEC_LABELS[key] || key} là bắt buộc.`;
    }
  }
  return "";
}

/**
 * Phiên bản: mọi ô hiển thị đều phải có giá trị (số 0 được phép nơi là tiền).
 * @param {object} options
 * @param {boolean} options.canViewCost
 */
export function validateVariantComplete(v, index, { canViewCost }) {
  const p = `Phiên bản #${index + 1}: `;
  const textFields = [
    ["color", "Màu"],
    ["ram", "RAM"],
    ["storage", "SSD / ổ cứng"],
    ["version", "CPU / phiên bản"],
  ];
  for (const [key, label] of textFields) {
    if (isBlank(v[key])) return p + `${label} không được để trống`;
  }
  const skuErr = validateSku(v.sku);
  if (skuErr) return p + skuErr;

  const retailValue = v.retailPrice != null && v.retailPrice !== "" ? v.retailPrice : v.price ?? 0;
  const retailErr = validateMoney(retailValue, { min: 0 });
  if (retailErr) return p + `Giá bán lẻ — ${retailErr}`;

  const st = validatePositiveInt(v.stock ?? 0, { min: 0 });
  if (st) return p + `Tồn kho — ${st}`;

  const low = validatePositiveInt(v.lowStockThreshold ?? 0, { min: 0 });
  if (low) return p + `Ngưỡng cảnh báo — ${low}`;

  const vatErr = validatePercent(v.vatRate !== undefined && v.vatRate !== null && v.vatRate !== "" ? v.vatRate : 10, {
    min: 0,
    max: 100,
  });
  if (vatErr) return p + `VAT — ${vatErr}`;

  if (isBlank(v.roundingRule)) return p + "Chọn quy tắc làm tròn";

  const origN = v.originalPrice === "" || v.originalPrice == null ? 0 : Number(v.originalPrice);
  const saleN = Number(retailValue);
  if (origN > 0 && origN <= saleN) {
    return p + "Giá gốc phải lớn hơn giá bán lẻ (hoặc nhập 0 để không dùng gạch ngang).";
  }

  const derivedPct =
    origN > 0 && origN > saleN ? Math.max(0, Math.min(100, Math.round(((origN - saleN) / origN) * 100))) : null;
  if (derivedPct === null) {
    const discountErr = validatePercent(v.discount ?? 0, { min: 0, max: 100 });
    if (discountErr) return p + `Giảm giá hiển thị — ${discountErr}`;
  }

  if (canViewCost) {
    const importErr = validateMoney(v.importPrice ?? 0, { min: 0 });
    if (importErr) return p + `Giá nhập — ${importErr}`;
    const logisticsErr = validateMoney(v.logisticsCost ?? 0, { min: 0 });
    if (logisticsErr) return p + `Chi phí vận chuyển — ${logisticsErr}`;
    const operationalErr = validateMoney(v.operationalCost ?? 0, { min: 0 });
    if (operationalErr) return p + `Chi phí vận hành — ${operationalErr}`;
    const marginErr =
      v.targetMarginPercent === "" || v.targetMarginPercent == null
        ? ""
        : validatePercent(v.targetMarginPercent, { min: 0, max: 100 });
    if (marginErr) return p + `% Margin mục tiêu — ${marginErr}`;
  }

  return "";
}
