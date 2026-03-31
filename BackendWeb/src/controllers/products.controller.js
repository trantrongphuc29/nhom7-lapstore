const productsService = require("../services/products.service");
const { sendSuccess } = require("../utils/response");

async function getProducts(req, res) {
  const result = await productsService.listProducts(req.query);
  sendSuccess(res, result);
}

async function getProductById(req, res) {
  const result = await productsService.getProductByParam(req.params.id);
  sendSuccess(res, result);
}

async function createProduct(req, res) {
  const result = await productsService.createProduct(req.body);
  sendSuccess(res, result, 201);
}

async function updateProduct(req, res) {
  const result = await productsService.updateProduct(req.params.id, req.body);
  sendSuccess(res, result);
}

async function deleteProduct(req, res) {
  const result = await productsService.deleteProduct(req.params.id);
  sendSuccess(res, result);
}

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
