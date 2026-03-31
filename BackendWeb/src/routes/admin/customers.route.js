const express = require("express");
const controller = require("../../controllers/admin/customers.controller");
const asyncHandler = require("../../middlewares/asyncHandler");
const validate = require("../../middlewares/validate");
const { validateIdParam } = require("../../validators/common.validator");

function buildAdminCustomersRouter(staffMiddlewares) {
  const router = express.Router();
  router.get("/customers", ...staffMiddlewares, asyncHandler(controller.getCustomers));
  router.get("/customers/:id", ...staffMiddlewares, validate(validateIdParam), asyncHandler(controller.getCustomerById));
  router.patch("/customers/:id/status", ...staffMiddlewares, validate(validateIdParam), asyncHandler(controller.updateCustomerStatus));
  return router;
}

module.exports = { buildAdminCustomersRouter };
