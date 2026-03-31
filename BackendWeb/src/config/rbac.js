/** Chuẩn hóa JWT role legacy */
function normalizeRole(role) {
  if (!role || role === "user") return "user";
  return "admin";
}

const ROLES = {
  ADMIN: "admin",
  USER: "user",
};

const STAFF_ROLES = [ROLES.ADMIN];

function isStaffRole(role) {
  return normalizeRole(role) === ROLES.ADMIN;
}

function isSuperAdmin(role) {
  return normalizeRole(role) === ROLES.ADMIN;
}

function canViewCostAndImport(role) {
  return normalizeRole(role) === ROLES.ADMIN;
}

function canEditCostAndImport(role) {
  return canViewCostAndImport(role);
}

function canViewProfit(role) {
  return normalizeRole(role) === ROLES.ADMIN;
}

function canManageWarehouse(role) {
  return normalizeRole(role) === ROLES.ADMIN;
}

function canManagePromotions(role) {
  return normalizeRole(role) === ROLES.ADMIN;
}

function canManageOrders(role) {
  return normalizeRole(role) === ROLES.ADMIN;
}

function canExportFinancialReports(role) {
  return normalizeRole(role) === ROLES.ADMIN;
}

function getPermissionsForRole(role) {
  const r = normalizeRole(role);
  return {
    role: r,
    canViewCostAndImport: canViewCostAndImport(r),
    canEditCostAndImport: canEditCostAndImport(r),
    canViewProfit: canViewProfit(r),
    canManageWarehouse: canManageWarehouse(r),
    canManagePromotions: canManagePromotions(r),
    canManageOrders: canManageOrders(r),
    canExportFinancialReports: canExportFinancialReports(r),
    maxSalesDiscountPercent: 100,
  };
}

function stripVariantSensitiveFields(variant, role) {
  if (canViewCostAndImport(role)) return variant;
  const v = { ...variant };
  delete v.import_price;
  delete v.importPrice;
  delete v.logistics_cost;
  delete v.logisticsCost;
  delete v.operational_cost;
  delete v.operationalCost;
  delete v.cost_price;
  delete v.costPrice;
  if (!canViewProfit(role)) {
    delete v.profit_amount;
    delete v.profitAmount;
    delete v.margin_percent;
    delete v.marginPercent;
    delete v.target_margin_percent;
    delete v.targetMarginPercent;
    delete v.vat_amount;
    delete v.vatAmount;
    delete v.marginBadgeClass;
  }
  return v;
}

module.exports = {
  ROLES,
  STAFF_ROLES,
  normalizeRole,
  isStaffRole,
  isSuperAdmin,
  canViewCostAndImport,
  canEditCostAndImport,
  canViewProfit,
  canManageWarehouse,
  canManagePromotions,
  canManageOrders,
  canExportFinancialReports,
  getPermissionsForRole,
  stripVariantSensitiveFields,
};
