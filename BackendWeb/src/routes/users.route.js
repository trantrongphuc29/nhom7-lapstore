const express = require("express");
const controller = require("../controllers/users.controller");
const asyncHandler = require("../middlewares/asyncHandler");
const validate = require("../middlewares/validate");
const { verifyToken, requireRole } = require("../middlewares/auth");
const { validateIdParam } = require("../validators/common.validator");
const { validateCreateUser } = require("../validators/users.validator");

const router = express.Router();

router.get("/", verifyToken, requireRole(["admin"]), asyncHandler(controller.getUsers));
router.get("/:id", verifyToken, requireRole(["admin"]), validate(validateIdParam), asyncHandler(controller.getUserById));
router.post("/", verifyToken, requireRole(["admin"]), validate(validateCreateUser), asyncHandler(controller.createUser));
router.put("/:id", verifyToken, requireRole(["admin"]), validate(validateIdParam), asyncHandler(controller.updateUser));
router.delete("/:id", verifyToken, requireRole(["admin"]), validate(validateIdParam), asyncHandler(controller.deleteUser));

module.exports = router;
