"use strict";

const express = require("express");
const router = express.Router();

const middlewares = require("../middlewares");
const PlaylistController = require("../controllers/playlist");
const PlaylistMusicController = require('../controllers/playlistmusic')

router.get("/", PlaylistController.list); // List all playlists

router.get("/public", PlaylistController.list_public); // List all public playlists

router.get("/my_playlists", middlewares.checkAuthentication, PlaylistController.list_user_playlists); // get user playlists, requires a logged in user

router.get("/:id", PlaylistController.read); // Read a playlist by Id

router.post("/", middlewares.checkAuthentication, PlaylistController.create); // Create a new Playlist

// TODO: Add authentication
router.put("/:id", PlaylistController.update) // Edit playlist by Id (like title)


router.delete("/:id", PlaylistController.remove) // Delete playlist by Id

router.post("/:id", PlaylistMusicController.create) // Adds new Songs to the playlist by Id

router.delete("/:id/:song_id", PlaylistMusicController.remove) // Removes the song by song_id from the playlist with id

//router.get("/songs/:songname", middlewares.checkAuthentication, PlaylistController.find_song)

//router.get("/songs/:songname", middlewares.getUserId, PlaylistController.find_song)

router.get("/songs/:songname", middlewares.checkAuthentication, PlaylistController.get_Recommendations)
//router.get("/songs/:songname", middlewares.checkAuthentication, PlaylistController.get_playlist_time)




router.put("/:id/songs/:song_id", middlewares.checkAuthentication, PlaylistController.add_song)

module.exports = router;
