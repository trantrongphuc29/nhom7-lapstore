const adminTaxonomyService = require("../../services/adminTaxonomy.service");
const { sendSuccess } = require("../../utils/response");

async function getBrands(req, res) {
  const result = await adminTaxonomyService.getBrands();
  sendSuccess(res, result);
}

async function getCategories(req, res) {
  const result = await adminTaxonomyService.getCategories();
  sendSuccess(res, result);
}

async function createBrand(req, res) {
  const result = await adminTaxonomyService.createBrand(req.body, req.user?.sub || null);
  sendSuccess(res, result, 201);
}

async function updateBrand(req, res) {
  const result = await adminTaxonomyService.updateBrand(req.params.id, req.body, req.user?.sub || null);
  sendSuccess(res, result);
}

async function deleteBrand(req, res) {
  const result = await adminTaxonomyService.deleteBrand(req.params.id, req.user?.sub || null);
  sendSuccess(res, result);
}

async function createCategory(req, res) {
  const result = await adminTaxonomyService.createCategory(req.body, req.user?.sub || null);
  sendSuccess(res, result, 201);
}

async function updateCategory(req, res) {
  const result = await adminTaxonomyService.updateCategory(req.params.id, req.body, req.user?.sub || null);
  sendSuccess(res, result);
}

module.exports = {
  getBrands,
  getCategories,
  createBrand,
  updateBrand,
  deleteBrand,
  createCategory,
  updateCategory,
};
