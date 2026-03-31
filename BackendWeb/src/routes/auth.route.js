const express = require("express");
const controller = require("../controllers/auth.controller");
const asyncHandler = require("../middlewares/asyncHandler");
const validate = require("../middlewares/validate");
const { verifyToken } = require("../middlewares/auth");
const { validateLogin, validateRegister } = require("../validators/auth.validator");

const router = express.Router();

router.post("/register", validate(validateRegister), asyncHandler(controller.register));
router.post("/login", validate(validateLogin), asyncHandler(controller.login));
router.get("/me", verifyToken, asyncHandler(controller.me));

module.exports = router;
