const express = require("express");
const rateLimit = require("express-rate-limit");
const controller = require("../controllers/storefrontOrders.controller");
const asyncHandler = require("../middlewares/asyncHandler");
const validate = require("../middlewares/validate");
const { optionalVerifyToken } = require("../middlewares/optionalAuth");
const { validateCreateStorefrontOrder } = require("../validators/storefrontOrders.validator");

const router = express.Router();

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Quá nhiều yêu cầu đặt hàng, thử lại sau.", code: "RATE_LIMITED" },
});

router.post(
  "/",
  checkoutLimiter,
  optionalVerifyToken,
  validate(validateCreateStorefrontOrder),
  asyncHandler(controller.postCreateOrder)
);

module.exports = router;
