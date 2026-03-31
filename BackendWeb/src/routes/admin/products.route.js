const express = require("express");
const controller = require("../../controllers/admin/products.controller");
const asyncHandler = require("../../middlewares/asyncHandler");
const validate = require("../../middlewares/validate");
const {
  validateBulkUpdateProductStatus,
  validateBulkDeleteProducts,
  validateAdminProductsQuery,
  validateSkuSuggestQuery,
} = require("../../validators/admin.validator");
const { validateIdParam } = require("../../validators/common.validator");

function buildAdminProductsRouter(staffMiddlewares) {
  const router = express.Router();
  router.get("/products", ...staffMiddlewares, validate(validateAdminProductsQuery), asyncHandler(controller.getProducts));
  router.get("/products/sku-suggest", ...staffMiddlewares, validate(validateSkuSuggestQuery), asyncHandler(controller.getSkuSuggest));
  router.get("/products/:id", ...staffMiddlewares, validate(validateIdParam), asyncHandler(controller.getProductById));
  router.post("/products", ...staffMiddlewares, asyncHandler(controller.createProduct));
  router.put("/products/:id", ...staffMiddlewares, validate(validateIdParam), asyncHandler(controller.updateProduct));
  router.patch(
    "/products/bulk-status",
    ...staffMiddlewares,
    validate(validateBulkUpdateProductStatus),
    asyncHandler(controller.bulkUpdateProductStatus)
  );
  router.delete(
    "/products/bulk-delete",
    ...staffMiddlewares,
    validate(validateBulkDeleteProducts),
    asyncHandler(controller.bulkDeleteProducts)
  );
  return router;
}

module.exports = { buildAdminProductsRouter };
