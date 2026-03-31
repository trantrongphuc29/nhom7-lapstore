const AppError = require("../utils/AppError");

module.exports = function validate(validator) {
  return (req, res, next) => {
    const errorMessage = validator(req);
    if (errorMessage) return next(new AppError(errorMessage, 400, "VALIDATION_ERROR"));
    return next();
  };
};
