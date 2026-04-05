const express = require("express");
const asyncHandler = require("../middlewares/asyncHandler");
const controller = require("../controllers/storeConfig.controller");

const router = express.Router();
router.get("/", asyncHandler(controller.getPublicStoreConfig));

module.exports = router;
