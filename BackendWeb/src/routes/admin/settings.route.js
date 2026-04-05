const express = require("express");
const controller = require("../../controllers/admin/settings.controller");
const asyncHandler = require("../../middlewares/asyncHandler");
const { verifyToken, requireSuperAdmin } = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const { validatePricingPreview } = require("../../validators/admin.validator");

function buildAdminSettingsRouter(staffMiddlewares) {
  const router = express.Router();
  router.get("/settings/pricing", ...staffMiddlewares, asyncHandler(controller.getPricingSettings));
  router.patch("/settings/pricing", verifyToken, requireSuperAdmin(), asyncHandler(controller.patchPricingSettings));
  router.get("/settings/storefront", ...staffMiddlewares, asyncHandler(controller.getStorefrontSettings));
  router.patch("/settings/storefront", verifyToken, requireSuperAdmin(), asyncHandler(controller.patchStorefrontSettings));
  router.post("/pricing/preview", ...staffMiddlewares, validate(validatePricingPreview), asyncHandler(controller.postPricingPreview));
  return router;
}

module.exports = { buildAdminSettingsRouter };
