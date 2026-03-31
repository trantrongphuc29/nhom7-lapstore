const storefrontOrdersService = require("../services/storefrontOrders.service");
const { sendSuccess } = require("../utils/response");

async function postCreateOrder(req, res) {
  const result = await storefrontOrdersService.createStorefrontOrder(req.body, req.user || null);
  sendSuccess(res, result, 201);
}

module.exports = { postCreateOrder };
