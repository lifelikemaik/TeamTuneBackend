"use strict";

const express = require("express");
const router = express.Router();

const middlewares = require("../middlewares");
const PlaylistController = require("../controllers/playlist");
const PlaylistMusicController = require('../controllers/playlistmusic')

router.get("/public", PlaylistController.list_public) // List all public playlists

router.get("/my_playlists", middlewares.checkAuthentication, PlaylistController.list_user_playlists) // get user playlists, requires a logged in user

router.get("/:id", middlewares.checkAuthentication, PlaylistController.read); // Read a playlist by Id

router.post("/:id/play", middlewares.checkAuthentication, PlaylistController.play) // Starts Playback of the specified playlist id on Spotify

router.get("/invited/:id", PlaylistController.read_invited); // Read a playlist by Id

//router.get("/:id", PlaylistController.readPublic); // Read a public playlist by Id

router.post("/", middlewares.checkAuthentication, PlaylistController.create) // Create a new Playlist

router.put("/:id", middlewares.checkAuthentication, PlaylistController.update) // Edit playlist by Id (like title)

router.get("/:id/follow", middlewares.checkAuthentication, PlaylistController.follow) // Follow playlist by Id (like title)

router.delete("/:id", middlewares.checkAuthentication, PlaylistController.remove) // Delete playlist by Id

router.post("/:id", PlaylistMusicController.create) // Adds new Songs to the playlist by Id TODO REMOVE THIS AND ITS FUNCTIONS

router.delete("/:id/:song_id", middlewares.checkAuthentication, PlaylistMusicController.remove) // Removes the song by song_id from the playlist with id

router.get("/songs/:songname", middlewares.checkAuthentication, PlaylistController.find_song)

router.get("/songs/:songname/invited/:id", PlaylistController.find_song_invited)

router.get("/fullrecommendation/:id", middlewares.checkAuthentication, PlaylistController.get_Full_List_Recommendations)

router.get("/length/:id", middlewares.checkAuthentication, PlaylistController.get_playlist_time)

router.put("/:id/songs/:song_id", middlewares.checkAuthentication, PlaylistController.add_song)

router.put("/invite/:id/songs/:song_id", PlaylistController.add_song_invited)

router.put("/copy/:id", middlewares.checkAuthentication, PlaylistController.copy)

module.exports = router;
