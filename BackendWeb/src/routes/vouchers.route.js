const express = require("express");
const rateLimit = require("express-rate-limit");
const controller = require("../controllers/vouchers.controller");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();

const voucherWriteLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Quá nhiều yêu cầu voucher, thử lại sau.", code: "RATE_LIMITED" },
});

router.post("/preview", voucherWriteLimit, asyncHandler(controller.postPreview));
router.post("/redeem", voucherWriteLimit, asyncHandler(controller.postRedeem));

module.exports = router;
