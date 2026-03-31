const authService = require("../services/auth.service");
const AuthUser = require("../../models/AuthUser");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");
const { getPermissionsForRole, normalizeRole } = require("../config/rbac");

async function register(req, res) {
  const result = await authService.register(req.body);
  sendSuccess(res, result, 201);
}

async function login(req, res) {
  const result = await authService.login(req.body);
  sendSuccess(res, result);
}

async function me(req, res) {
  const row = await AuthUser.findPublicById(req.user.sub);
  if (!row) throw new AppError("User not found", 404, "NOT_FOUND");
  const role = normalizeRole(row.role);
  sendSuccess(res, {
    id: row.id,
    email: row.email,
    fullName: row.full_name || null,
    phone: row.phone || null,
    role,
    permissions: getPermissionsForRole(role),
  });
}

module.exports = { register, login, me };
