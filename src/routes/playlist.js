"use strict";

const express = require("express");
const router = express.Router();

const PlaylistController = require("../controllers/playlist");
const PlaylistMusicController = require('../controllers/playlistmusic')

router.get("/", PlaylistController.list); // List all playlists

router.get("/public", PlaylistController.list_public); // List all public playlists

router.get("/:id", PlaylistController.read); // Read a playlist by Id

// TODO: Add authentication
router.post("/", PlaylistController.create); // Create a new Playlist

// TODO: Add authentication
router.put("/:id", PlaylistController.update) // Edit playlist by Id (like title)


router.delete("/:id", PlaylistController.remove) // Delete playlist by Id

router.post("/:id", PlaylistMusicController.create) // Adds new Songs to the playlist by Id

router.delete("/:id/:song_id", PlaylistMusicController.remove) // Removes the song by song_id from the playlist with id

module.exports = router;
