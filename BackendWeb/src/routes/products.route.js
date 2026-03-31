const express = require("express");
const controller = require("../controllers/products.controller");
const asyncHandler = require("../middlewares/asyncHandler");
const validate = require("../middlewares/validate");
const { verifyToken, requireRole } = require("../middlewares/auth");
const { validateIdParam } = require("../validators/common.validator");
const { validateProductQuery, validateProductParam } = require("../validators/products.validator");

const router = express.Router();

router.get("/", validate(validateProductQuery), asyncHandler(controller.getProducts));
router.get("/:id", validate(validateProductParam), asyncHandler(controller.getProductById));
router.post("/", verifyToken, requireRole(["admin"]), asyncHandler(controller.createProduct));
router.put("/:id", verifyToken, requireRole(["admin"]), validate(validateIdParam), asyncHandler(controller.updateProduct));
router.delete("/:id", verifyToken, requireRole(["admin"]), validate(validateIdParam), asyncHandler(controller.deleteProduct));

module.exports = router;
