const adminSettingsService = require("../../services/adminSettings.service");
const adminAuditService = require("../../services/adminAudit.service");
const { computeVariantPricing } = require("../../utils/pricingEngine");
const { sendSuccess } = require("../../utils/response");

async function getPricingSettings(req, res) {
  const settings = await adminSettingsService.getPricingSettings();
  sendSuccess(res, settings);
}

async function getStorefrontSettings(req, res) {
  const settings = await adminSettingsService.getStorefrontSettings();
  sendSuccess(res, settings);
}

async function patchStorefrontSettings(req, res) {
  const next = await adminSettingsService.updateStorefrontSettings(req.body || {});
  await adminAuditService.createAuditLog({
    userId: req.user?.sub || null,
    module: "settings",
    action: "storefront_update",
    targetType: "storefront_settings",
    targetId: "default",
    metadata: { keys: Object.keys(req.body || {}) },
  });
  sendSuccess(res, next);
}

async function patchPricingSettings(req, res) {
  const next = await adminSettingsService.updatePricingSettings(req.body || {});
  await adminAuditService.createAuditLog({
    userId: req.user?.sub || null,
    module: "settings",
    action: "pricing_update",
    targetType: "pricing_settings",
    targetId: "default",
    metadata: { keys: Object.keys(req.body || {}) },
  });
  sendSuccess(res, next);
}

async function postPricingPreview(req, res) {
  const settings = await adminSettingsService.getPricingSettings();
  const computed = computeVariantPricing(req.body || {}, settings);
  sendSuccess(res, computed);
}

module.exports = {
  getPricingSettings,
  patchPricingSettings,
  postPricingPreview,
  getStorefrontSettings,
  patchStorefrontSettings,
};
