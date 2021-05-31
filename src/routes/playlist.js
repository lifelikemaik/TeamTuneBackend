"use strict";

const express = require("express");
const router = express.Router();

const PlaylistController = require("../controllers/playlist");
const PlaylistMusicController = require('../controllers/playlistmusic')

router.get("/", PlaylistController.list); // List all playlists

router.get("/:id", PlaylistController.read); // Read a playlist by Id

// TODO: Add authentication
router.post("/", PlaylistController.create); // Create a new Playlist

// TODO: Add authentication
router.put("/:id", PlaylistController.update) // Edit playlist (like title)


router.put("/:id", PlaylistController.remove) // Edit playlist (like title)

router.post("/:id", PlaylistMusicController.create) // Adds new Songs to the playlist

router.delete("/:id/:song_id", PlaylistMusicController.remove) // Removes the song by song_id from the playlist with id

module.exports = router;
