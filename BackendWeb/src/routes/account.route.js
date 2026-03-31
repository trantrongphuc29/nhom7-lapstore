const express = require("express");
const controller = require("../controllers/account.controller");
const asyncHandler = require("../middlewares/asyncHandler");
const validate = require("../middlewares/validate");
const { verifyToken } = require("../middlewares/auth");
const { validateIdParam } = require("../validators/common.validator");
const {
  validatePatchProfile,
  validateChangePassword,
  validateCreateAddress,
  validateUpdateAddress,
  validatePutCart,
} = require("../validators/account.validator");

const router = express.Router();

router.use(verifyToken);

router.get("/profile", asyncHandler(controller.profile));
router.patch("/profile", validate(validatePatchProfile), asyncHandler(controller.updateProfile));
router.post("/password", validate(validateChangePassword), asyncHandler(controller.changePassword));

router.get("/addresses", asyncHandler(controller.addresses));
router.post("/addresses", validate(validateCreateAddress), asyncHandler(controller.createAddress));
router.put(
  "/addresses/:id",
  validate(validateIdParam),
  validate(validateUpdateAddress),
  asyncHandler(controller.updateAddress)
);
router.delete("/addresses/:id", validate(validateIdParam), asyncHandler(controller.deleteAddress));

router.get("/orders", asyncHandler(controller.orders));

router.get("/cart", asyncHandler(controller.getCart));
router.put("/cart", validate(validatePutCart), asyncHandler(controller.putCart));

module.exports = router;
