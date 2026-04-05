const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AuthUser = require("../models/AuthUser");
const AppError = require("../utils/AppError");
const { getJwtSecret } = require("../config/env");
const { getPermissionsForRole, normalizeRole } = require("../config/rbac");

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildTokenPayload(user) {
  return { sub: user.id, email: user.email, role: normalizeRole(user.role) };
}

async function register(payload) {
  const { email, password, confirmPassword } = payload;
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!email || !password || !confirmPassword) {
    throw new AppError("Email, password, confirmPassword are required", 400, "VALIDATION_ERROR");
  }
  if (!isValidEmail(normalizedEmail)) throw new AppError("Email is invalid", 400, "VALIDATION_ERROR");
  if (password.length < 3) throw new AppError("Password must be at least 3 characters", 400, "VALIDATION_ERROR");
  if (password !== confirmPassword) throw new AppError("Password confirmation does not match", 400, "VALIDATION_ERROR");
  const existingUser = await AuthUser.findByEmail(normalizedEmail);
  if (existingUser) throw new AppError("Email already exists", 409, "CONFLICT");
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await AuthUser.create({ email: normalizedEmail, passwordHash, role: "user" });
  const role = normalizeRole(user.role);
  return {
    message: "Register successfully",
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name || null,
      phone: user.phone || null,
      role,
      permissions: getPermissionsForRole(role),
    },
  };
}

async function login(payload) {
  const { email, password } = payload;
  if (!email || !password) throw new AppError("Email and password are required", 400, "VALIDATION_ERROR");
  const user = await AuthUser.findByEmail(email.trim().toLowerCase());
  if (!user) throw new AppError("Invalid credentials", 401, "UNAUTHORIZED");
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new AppError("Invalid credentials", 401, "UNAUTHORIZED");
  const token = jwt.sign(buildTokenPayload(user), getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
  const role = normalizeRole(user.role);
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name || null,
      phone: user.phone || null,
      role,
      permissions: getPermissionsForRole(role),
    },
  };
}

module.exports = { register, login };
