const User = require("../models/User");
const AppError = require("../utils/AppError");

function simplifyUser(user) {
  return { id: user.id, name: user.name };
}

async function listUsers() {
  const users = await User.read();
  return { records: users.map(simplifyUser) };
}

async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  return simplifyUser(user);
}

async function createUser(payload) {
  const { name, email, password } = payload;
  const user = new User({ name, email, password });
  return user.save();
}

async function updateUser(id, payload) {
  const user = await User.findById(id);
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  Object.assign(user, payload);
  return user.update();
}

async function deleteUser(id) {
  const deleted = await User.delete(id);
  if (!deleted) throw new AppError("User not found", 404, "NOT_FOUND");
  return { message: "User deleted successfully" };
}

module.exports = { listUsers, getUserById, createUser, updateUser, deleteUser };
