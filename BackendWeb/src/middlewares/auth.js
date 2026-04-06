const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const { getJwtSecret } = require("../config/env");
const { normalizeRole, isStaffRole, isSuperAdmin } = require("../config/rbac");
const AuthUser = require("../models/AuthUser");

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return next(
      new AppError(
        "Authentication required. Gửi header Authorization: Bearer <token> (đăng nhập admin để lấy JWT).",
        401,
        "UNAUTHORIZED"
      )
    );
  }
  try {
    const payload = jwt.verify(token, getJwtSecret());
    const normalizedRole = normalizeRole(payload.role);
    const accessState = await AuthUser.getAccountAccessState(payload.sub);
    if (!accessState) return next(new AppError("User not found", 401, "UNAUTHORIZED"));
    if (accessState.isBlocked) {
      return next(new AppError("Tài khoản đã bị khóa", 401, "ACCOUNT_BLOCKED"));
    }
    req.user = { ...payload, role: normalizedRole };
    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401, "UNAUTHORIZED"));
  }
}

function requireRole(allowedRoles = []) {
  const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));
  return (req, res, next) => {
    if (!req.user) return next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
    if (!normalizedAllowed.includes(normalizeRole(req.user.role))) {
      return next(new AppError("Access denied", 403, "FORBIDDEN"));
    }
    return next();
  };
}

function requireStaff() {
  return (req, res, next) => {
    if (!req.user) return next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
    if (!isStaffRole(req.user.role)) return next(new AppError("Access denied", 403, "FORBIDDEN"));
    return next();
  };
}

function requireSuperAdmin() {
  return (req, res, next) => {
    if (!req.user) return next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
    if (!isSuperAdmin(req.user.role)) return next(new AppError("Chỉ Admin", 403, "FORBIDDEN"));
    return next();
  };
}

module.exports = { verifyToken, requireRole, requireStaff, requireSuperAdmin };
