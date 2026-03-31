const adminPromotionsService = require("../../services/adminPromotions.service");
const { sendSuccess } = require("../../utils/response");

async function getPromotions(req, res) {
  const result = await adminPromotionsService.getPromotionsOverview();
  sendSuccess(res, result);
}

async function createVoucher(req, res) {
  const result = await adminPromotionsService.createVoucher(req.body, req.user?.sub || null);
  sendSuccess(res, result, 201);
}

async function updateVoucher(req, res) {
  const result = await adminPromotionsService.updateVoucher(req.params.id, req.body, req.user?.sub || null);
  sendSuccess(res, result);
}

async function deleteVoucher(req, res) {
  const result = await adminPromotionsService.deleteVoucher(req.params.id, req.user?.sub || null);
  sendSuccess(res, result);
}

module.exports = { getPromotions, createVoucher, updateVoucher, deleteVoucher };
