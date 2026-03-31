const ALLOWED_PRODUCT_STATUS = new Set(["active", "inactive", "out_of_stock", "coming_soon"]);
const ALLOWED_REPORT_TYPES = new Set(["revenue", "inventory", "products", "products_all", "imports"]);
const ALLOWED_PERIOD_TYPES = new Set(["day", "month", "quarter", "year", "custom"]);
const ALLOWED_PRODUCT_SORT_BY = new Set(["created_at", "name", "sale_price", "stock"]);
const ALLOWED_SORT_DIR = new Set(["asc", "desc"]);

function isPositiveInt(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0;
}

function validateIdsArray(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return "ids phải là mảng không rỗng";
  if (!ids.every(isPositiveInt)) return "ids chỉ gồm số nguyên dương";
  return null;
}

function validateBulkUpdateProductStatus(req) {
  const idsErr = validateIdsArray(req.body?.ids);
  if (idsErr) return idsErr;
  const status = String(req.body?.status || "").trim();
  if (!ALLOWED_PRODUCT_STATUS.has(status)) return "status không hợp lệ";
  return null;
}

function validateBulkDeleteProducts(req) {
  return validateIdsArray(req.body?.ids);
}

function validatePricingPreview(req) {
  const b = req.body || {};
  const moneyFields = ["import_price", "logistics_cost", "operational_cost", "retail_price"];
  for (const key of moneyFields) {
    const val = b[key];
    if (val == null || val === "") continue;
    const n = Number(val);
    if (!Number.isFinite(n) || n < 0) return `${key} phải là số >= 0`;
  }
  const vat = b.vat_rate;
  if (vat != null && vat !== "") {
    const n = Number(vat);
    if (!Number.isFinite(n) || n < 0 || n > 100) return "vat_rate phải trong khoảng 0-100";
  }
  const margin = b.target_margin_percent;
  if (margin != null && margin !== "") {
    const n = Number(margin);
    if (!Number.isFinite(n) || n < 0 || n > 100) return "target_margin_percent phải trong khoảng 0-100";
  }
  return null;
}

function validateReportExport(req) {
  const report = String(req.query?.report || "").trim().toLowerCase();
  if (!ALLOWED_REPORT_TYPES.has(report)) return "report không hợp lệ";
  const periodType = String(req.query?.periodType || "month").trim().toLowerCase();
  if (!ALLOWED_PERIOD_TYPES.has(periodType)) return "periodType không hợp lệ";
  return null;
}

function validateExcelImport(req) {
  const type = String(req.body?.type || "").trim();
  if (!type) return "type là bắt buộc";
  if (!Array.isArray(req.body?.rows)) return "rows phải là mảng";
  return null;
}

function validateAdminProductsQuery(req) {
  const q = req.query || {};
  if (q.page != null && q.page !== "" && (!Number.isInteger(Number(q.page)) || Number(q.page) <= 0)) {
    return "page phải là số nguyên dương";
  }
  if (q.limit != null && q.limit !== "" && (!Number.isInteger(Number(q.limit)) || Number(q.limit) <= 0)) {
    return "limit phải là số nguyên dương";
  }
  if (q.sortBy != null && q.sortBy !== "" && !ALLOWED_PRODUCT_SORT_BY.has(String(q.sortBy))) {
    return "sortBy không hợp lệ";
  }
  if (q.sortDir != null && q.sortDir !== "" && !ALLOWED_SORT_DIR.has(String(q.sortDir).toLowerCase())) {
    return "sortDir không hợp lệ";
  }
  if (q.status != null && q.status !== "" && !ALLOWED_PRODUCT_STATUS.has(String(q.status))) {
    return "status không hợp lệ";
  }
  const minPrice = q.minPrice;
  if (minPrice != null && minPrice !== "" && (!Number.isFinite(Number(minPrice)) || Number(minPrice) < 0)) {
    return "minPrice phải là số >= 0";
  }
  const maxPrice = q.maxPrice;
  if (maxPrice != null && maxPrice !== "" && (!Number.isFinite(Number(maxPrice)) || Number(maxPrice) < 0)) {
    return "maxPrice phải là số >= 0";
  }
  return null;
}

function validateSkuSuggestQuery(req) {
  const q = req.query || {};
  const scope = String(q.scope || q.type || "variant").toLowerCase();
  if (!["variant", "product"].includes(scope)) return "scope/type không hợp lệ";
  if (q.productId != null && q.productId !== "" && !isPositiveInt(q.productId)) return "productId không hợp lệ";
  if (q.variantId != null && q.variantId !== "" && !isPositiveInt(q.variantId)) return "variantId không hợp lệ";
  return null;
}

module.exports = {
  validateBulkUpdateProductStatus,
  validateBulkDeleteProducts,
  validatePricingPreview,
  validateReportExport,
  validateExcelImport,
  validateAdminProductsQuery,
  validateSkuSuggestQuery,
};
