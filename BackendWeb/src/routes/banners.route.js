const express = require("express");
const controller = require("../controllers/banners.controller");
const asyncHandler = require("../middlewares/asyncHandler");
const validate = require("../middlewares/validate");
const { verifyToken, requireStaff } = require("../middlewares/auth");
const { validateIdParam } = require("../validators/common.validator");

const router = express.Router();

router.get("/", asyncHandler(controller.getBanners));
router.get("/:id", validate(validateIdParam), asyncHandler(controller.getBannerById));
const staff = [verifyToken, requireStaff()];
router.post("/", ...staff, asyncHandler(controller.createBanner));
router.put("/:id", ...staff, validate(validateIdParam), asyncHandler(controller.updateBanner));
router.delete("/:id", ...staff, validate(validateIdParam), asyncHandler(controller.deleteBanner));

module.exports = router;
