"use strict";

const PlaylistMusicModel = require("../models/playlistmusic");
const PlaylistModel = require("../models/playlist")

const create = async (req, res) => {
    // check if the body of the request contains all necessary properties
    if (Object.keys(req.body).length === 0)
        return res.status(400).json({
            error: "Bad Request",
            message: "The request body is empty",
        });

    // handle the request
    try {
        // Find the playlist we want to update
        console.log('req.params.id: ', req.params.id);
        let playlist = await PlaylistModel.findById(req.params.id).exec();
        console.log('playlist: ', playlist);
        playlist.music_info.songs.push(req.body);
        // TODO: Update all the other parameters
        
        playlist.save();

        // return updated playlist
        return res.status(201).json(playlist);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal server error",
            message: err.message,
        });
    }
};

module.exports = {
    create
};
