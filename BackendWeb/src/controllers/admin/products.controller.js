const adminProductsService = require("../../services/adminProducts.service");
const { sendSuccess } = require("../../utils/response");

async function getProducts(req, res) {
  const result = await adminProductsService.getAdminProducts(req.query);
  sendSuccess(res, result);
}

async function createProduct(req, res) {
  const result = await adminProductsService.createAdminProduct(req.body, req.user?.role, req.user?.sub || null);
  sendSuccess(res, result, 201);
}

async function getSkuSuggest(req, res) {
  const q = req.query || {};
  const result =
    q.scope === "product" || q.type === "product"
      ? await adminProductsService.suggestProductSkuPreview(q)
      : await adminProductsService.suggestVariantSkuPreview(q);
  sendSuccess(res, result);
}

async function getProductById(req, res) {
  const result = await adminProductsService.getAdminProductById(req.params.id);
  sendSuccess(res, result);
}

async function updateProduct(req, res) {
  const result = await adminProductsService.updateAdminProduct(req.params.id, req.body, req.user?.role, req.user?.sub || null);
  sendSuccess(res, result);
}

async function bulkUpdateProductStatus(req, res) {
  const result = await adminProductsService.bulkUpdateStatus(req.body.ids, req.body.status, req.user?.sub || null);
  sendSuccess(res, result);
}

async function bulkDeleteProducts(req, res) {
  const result = await adminProductsService.bulkDeleteProducts(req.body.ids, req.user?.sub || null);
  sendSuccess(res, result);
}

module.exports = {
  getProducts,
  createProduct,
  getSkuSuggest,
  getProductById,
  updateProduct,
  bulkUpdateProductStatus,
  bulkDeleteProducts,
};
