const express = require("express");
const controller = require("../../controllers/admin/taxonomy.controller");
const asyncHandler = require("../../middlewares/asyncHandler");
const validate = require("../../middlewares/validate");
const { validateIdParam } = require("../../validators/common.validator");

function buildAdminTaxonomyRouter(staffMiddlewares) {
  const router = express.Router();
  router.get("/brands", ...staffMiddlewares, asyncHandler(controller.getBrands));
  router.get("/categories", ...staffMiddlewares, asyncHandler(controller.getCategories));
  router.post("/brands", ...staffMiddlewares, asyncHandler(controller.createBrand));
  router.put("/brands/:id", ...staffMiddlewares, validate(validateIdParam), asyncHandler(controller.updateBrand));
  router.delete("/brands/:id", ...staffMiddlewares, validate(validateIdParam), asyncHandler(controller.deleteBrand));
  router.post("/categories", ...staffMiddlewares, asyncHandler(controller.createCategory));
  router.put("/categories/:id", ...staffMiddlewares, validate(validateIdParam), asyncHandler(controller.updateCategory));
  return router;
}

module.exports = { buildAdminTaxonomyRouter };
