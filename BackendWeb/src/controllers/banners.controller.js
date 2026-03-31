const bannersService = require("../services/banners.service");
const { sendSuccess } = require("../utils/response");

async function getBanners(req, res) {
  sendSuccess(res, await bannersService.listBanners());
}

async function getBannerById(req, res) {
  sendSuccess(res, await bannersService.getBannerById(req.params.id));
}

async function createBanner(req, res) {
  const created = await bannersService.createBanner(req.body);
  sendSuccess(res, created, 201);
}

async function updateBanner(req, res) {
  sendSuccess(res, await bannersService.updateBanner(req.params.id, req.body));
}

async function deleteBanner(req, res) {
  sendSuccess(res, await bannersService.deleteBanner(req.params.id));
}

module.exports = { getBanners, getBannerById, createBanner, updateBanner, deleteBanner };
