const AppError = require("../utils/AppError");

module.exports = function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const normalized = err instanceof AppError ? err : new AppError(err.message || "Something went wrong", 500);
  if (normalized.statusCode >= 500) {
    console.error(err);
  }
  return res.status(normalized.statusCode).json({
    success: false,
    message: normalized.message,
    errors: [{ code: normalized.code }],
  });
};
