"use strict";

const express = require("express");
const router = express.Router();
const middlewares = require("../middlewares");
const CallbackController = require("../controllers/callback");

// router.get("/initialize", CallbackController.initializeToken);
router.get("/register", CallbackController.registerSpotify);

module.exports = router;