const vouchersService = require("../services/vouchers.service");
const { sendSuccess } = require("../utils/response");

async function postPreview(req, res) {
  const { code, subtotal } = req.body || {};
  const result = await vouchersService.previewVoucher(code, subtotal);
  sendSuccess(res, result);
}

async function postRedeem(req, res) {
  const { code, subtotal } = req.body || {};
  const result = await vouchersService.redeemVoucher(code, subtotal);
  sendSuccess(res, result);
}

module.exports = { postPreview, postRedeem };
