const Banner = require("../models/Banner");
const AppError = require("../utils/AppError");

async function listBanners() {
  const banners = await Banner.read();
  return { records: banners };
}

async function getBannerById(id) {
  const banner = await Banner.findById(id);
  if (!banner) throw new AppError("Banner not found", 404, "NOT_FOUND");
  return banner;
}

async function createBanner(payload) {
  const banner = new Banner(payload);
  return banner.save();
}

async function updateBanner(id, payload) {
  const banner = await Banner.findById(id);
  if (!banner) throw new AppError("Banner not found", 404, "NOT_FOUND");
  Object.assign(banner, payload);
  return banner.update();
}

async function deleteBanner(id) {
  const deleted = await Banner.delete(id);
  if (!deleted) throw new AppError("Banner not found", 404, "NOT_FOUND");
  return { message: "Banner deleted successfully" };
}

module.exports = { listBanners, getBannerById, createBanner, updateBanner, deleteBanner };
