const adminCustomersService = require("../../services/adminCustomers.service");
const { sendSuccess } = require("../../utils/response");

async function getCustomers(req, res) {
  const result = await adminCustomersService.getAdminCustomers(req.query);
  sendSuccess(res, result);
}

async function getCustomerById(req, res) {
  const result = await adminCustomersService.getAdminCustomerById(req.params.id);
  sendSuccess(res, result);
}

async function updateCustomerStatus(req, res) {
  const result = await adminCustomersService.updateAdminCustomerStatus(req.params.id, req.body, req.user?.sub || null);
  sendSuccess(res, result);
}

module.exports = { getCustomers, getCustomerById, updateCustomerStatus };
