const express = require("express");
const controller = require("../../controllers/admin/orders.controller");
const asyncHandler = require("../../middlewares/asyncHandler");
const validate = require("../../middlewares/validate");
const { validateIdParam } = require("../../validators/common.validator");

function buildAdminOrdersRouter(staffMiddlewares) {
  const router = express.Router();
  router.get("/orders", ...staffMiddlewares, asyncHandler(controller.getOrders));
  router.get("/orders/:id", ...staffMiddlewares, validate(validateIdParam), asyncHandler(controller.getOrderById));
  router.patch("/orders/:id/status", ...staffMiddlewares, validate(validateIdParam), asyncHandler(controller.updateOrderStatus));
  return router;
}

module.exports = { buildAdminOrdersRouter };
