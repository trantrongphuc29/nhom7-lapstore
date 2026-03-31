const Product = require("../models/Product");
const AppError = require("../utils/AppError");

function buildProductFilters(query) {
  const { brand, cpu, ram, storage, minPrice, maxPrice, keyword, priceRanges } = query;
  const filters = {};
  if (brand) filters.brands = String(brand).split(",");
  if (cpu) filters.cpu = cpu;
  if (ram) filters.ram = ram;
  if (storage) filters.storage = storage;
  if (minPrice) filters.minPrice = parseFloat(minPrice);
  if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
  if (keyword) filters.keyword = keyword;
  if (priceRanges) {
    filters.priceRanges = String(priceRanges).split(",").map((s) => s.trim()).filter(Boolean);
  }
  return filters;
}

async function listProducts(query) {
  const filters = buildProductFilters(query);
  const products = await Product.search(filters);
  return { records: products };
}

async function getProductById(id) {
  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found", 404, "NOT_FOUND");
  return product;
}

/** Chi tiết storefront: tham số là id số hoặc slug */
async function getProductByParam(param) {
  const p = String(param ?? "").trim();
  if (!p) throw new AppError("Product not found", 404, "NOT_FOUND");
  if (/^\d+$/.test(p)) {
    const product = await Product.findById(Number(p));
    if (!product) throw new AppError("Product not found", 404, "NOT_FOUND");
    return product;
  }
  const product = await Product.findBySlug(p);
  if (!product) throw new AppError("Product not found", 404, "NOT_FOUND");
  return product;
}

async function createProduct(payload) {
  const product = new Product(payload);
  return product.save();
}

async function updateProduct(id, payload) {
  const existing = await Product.findById(id);
  if (!existing) throw new AppError("Product not found", 404, "NOT_FOUND");
  const product = new Product({ ...existing, ...payload, id });
  return product.update();
}

async function deleteProduct(id) {
  const deleted = await Product.delete(id);
  if (!deleted) throw new AppError("Product not found", 404, "NOT_FOUND");
  return { message: "Product deleted successfully" };
}

module.exports = { listProducts, getProductById, getProductByParam, createProduct, updateProduct, deleteProduct };
