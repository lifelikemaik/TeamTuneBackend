"use strict";

const express = require("express");
const router = express.Router();
const middlewares = require("../middlewares");
const AuthController = require("../controllers/auth");

router.post("/login", AuthController.login); // login
router.post("/register", AuthController.register); // register a new user
router.post("/register_invite", AuthController.registerInvite); // register a new invited user
router.get("/me", middlewares.checkAuthentication, AuthController.me); // get own username, requires a logged in user
router.get("/logout", middlewares.checkAuthentication, AuthController.logout); // logout user
router.delete("/delete_account/:id", middlewares.checkAuthentication, AuthController.deleteAccount); // delete user

module.exports = router;
