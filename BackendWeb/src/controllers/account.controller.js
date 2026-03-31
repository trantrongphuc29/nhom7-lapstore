const accountService = require("../services/account.service");
const { sendSuccess } = require("../utils/response");

async function profile(req, res) {
  const data = await accountService.getProfile(req.user.sub);
  sendSuccess(res, data);
}

async function updateProfile(req, res) {
  const data = await accountService.updateProfile(req.user.sub, req.body);
  sendSuccess(res, data);
}

async function changePassword(req, res) {
  const data = await accountService.changePassword(req.user.sub, req.body);
  sendSuccess(res, data);
}

async function addresses(req, res) {
  const data = await accountService.listAddresses(req.user.sub);
  sendSuccess(res, data);
}

async function createAddress(req, res) {
  const data = await accountService.createAddress(req.user.sub, req.body);
  sendSuccess(res, data, 201);
}

async function updateAddress(req, res) {
  const data = await accountService.updateAddress(req.user.sub, req.params.id, req.body);
  sendSuccess(res, data);
}

async function deleteAddress(req, res) {
  const data = await accountService.deleteAddress(req.user.sub, req.params.id);
  sendSuccess(res, data);
}

async function orders(req, res) {
  const data = await accountService.listOrders(req.user.sub);
  sendSuccess(res, data);
}

async function getCart(req, res) {
  const data = await accountService.getCart(req.user.sub);
  sendSuccess(res, data);
}

async function putCart(req, res) {
  const data = await accountService.putCart(req.user.sub, req.body);
  sendSuccess(res, data);
}

module.exports = {
  profile,
  updateProfile,
  changePassword,
  addresses,
  createAddress,
  updateAddress,
  deleteAddress,
  orders,
  getCart,
  putCart,
};
