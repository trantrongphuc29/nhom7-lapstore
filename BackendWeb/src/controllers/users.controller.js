const usersService = require("../services/users.service");
const { sendSuccess } = require("../utils/response");

async function getUsers(req, res) {
  sendSuccess(res, await usersService.listUsers());
}

async function getUserById(req, res) {
  sendSuccess(res, await usersService.getUserById(req.params.id));
}

async function createUser(req, res) {
  const created = await usersService.createUser(req.body);
  sendSuccess(res, created, 201);
}

async function updateUser(req, res) {
  sendSuccess(res, await usersService.updateUser(req.params.id, req.body));
}

async function deleteUser(req, res) {
  sendSuccess(res, await usersService.deleteUser(req.params.id));
}

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };
