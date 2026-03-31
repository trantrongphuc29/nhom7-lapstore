const express = require("express");
const controller = require("../../controllers/admin/promotions.controller");
const asyncHandler = require("../../middlewares/asyncHandler");
const validate = require("../../middlewares/validate");
const { validateIdParam } = require("../../validators/common.validator");

function buildAdminPromotionsRouter(staffMiddlewares) {
  const router = express.Router();
  router.get("/promotions", ...staffMiddlewares, asyncHandler(controller.getPromotions));
  router.post("/promotions/vouchers", ...staffMiddlewares, asyncHandler(controller.createVoucher));
  router.put("/promotions/vouchers/:id", ...staffMiddlewares, validate(validateIdParam), asyncHandler(controller.updateVoucher));
  router.delete("/promotions/vouchers/:id", ...staffMiddlewares, validate(validateIdParam), asyncHandler(controller.deleteVoucher));
  return router;
}

module.exports = { buildAdminPromotionsRouter };
