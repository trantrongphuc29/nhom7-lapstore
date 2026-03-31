const adminOrdersService = require("../../services/adminOrders.service");
const { sendSuccess } = require("../../utils/response");

async function getOrders(req, res) {
  const result = await adminOrdersService.getAdminOrders(req.query);
  sendSuccess(res, result);
}

async function getOrderById(req, res) {
  const result = await adminOrdersService.getAdminOrderById(req.params.id);
  sendSuccess(res, result);
}

async function updateOrderStatus(req, res) {
  const actorId = req.user?.sub != null ? Number(req.user.sub) || req.user.sub : null;
  const result = await adminOrdersService.updateAdminOrderStatus(req.params.id, req.body, actorId);
  sendSuccess(res, result);
}

module.exports = { getOrders, getOrderById, updateOrderStatus };
