"use strict";

const PlaylistModel = require("../models/playlist");


const read = async (req, res) => {
    try {
        // get playlist with id from database
        let playlist = await PlaylistModel.findById(req.params.id).exec();

        // if no playlist with id is found, return 404
        if (!playlist)
            return res.status(404).json({
                error: "Not Found",
                message: `Playlist not found`,
            });

        // return gotten playlist
        return res.status(200).json(playlist);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal Server Error",
            message: err.message,
        });
    }
};


const list = async (req, res) => {
    try {
        // get all playlists in database
        let playlists = await PlaylistModel.find({}).exec();

        // return gotten playlists
        return res.status(200).json(playlists);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal server error",
            message: err.message,
        });
    }
};


module.exports = {
    read,
    list,
};
