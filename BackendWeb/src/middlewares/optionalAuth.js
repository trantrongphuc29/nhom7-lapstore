const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const { getJwtSecret } = require("../config/env");
const { normalizeRole } = require("../config/rbac");

/**
 * Có Authorization thì verify JWT; không có thì tiếp tục (guest).
 * Token sai / hết hạn → 401.
 */
function optionalVerifyToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.user = { ...payload, role: normalizeRole(payload.role) };
    return next();
  } catch {
    return next(new AppError("Token không hợp lệ hoặc đã hết hạn", 401, "UNAUTHORIZED"));
  }
}

module.exports = { optionalVerifyToken };
