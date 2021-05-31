"use strict";

const express = require("express");
const router = express.Router();

const PlaylistController = require("../controllers/playlist");

router.get("/", PlaylistController.list); // List all playlists

router.get("/:id", PlaylistController.read); // Read a playlist by Id

module.exports = router;
