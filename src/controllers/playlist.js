"use strict";

const PlaylistModel = require("../models/playlist");
const UserModel = require("../models/user");
const {getUserPlaylistsSpotify} = require("../spotifyControllers");

const create = async (req, res) => {
    // check if the body of the request contains all necessary properties
    if (Object.keys(req.body).length === 0)
        return res.status(400).json({
            error: "Bad Request",
            message: "The request body is empty",
        });

    // handle the request
    try {
        // create playlist in database
        let playlist = await PlaylistModel.create(req.body);
        // add playlist id to users playlists
        let user_playlists = await UserModel.update(
            {_id: req.userId},
            {$addToSet: {playlists: playlist._id}}
        ).exec();
        // return created playlist
        return res.status(201).json(playlist);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal server error",
            message: err.message,
        });
    }
};

const update = async (req, res) => {
    // check if the body of the request contains all necessary properties
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({
            error: "Bad Request",
            message: "The request body is empty",
        });
    }

    // handle the request
    try {
        // find and update playlist with id
        let playlist = await PlaylistModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        ).exec();

        // return updated playlist
        return res.status(200).json(playlist);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal server error",
            message: err.message,
        });
    }
};

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

const remove = async (req, res) => {
    try {
        // find and remove playlist
        await PlaylistModel.findByIdAndRemove(req.params.id).exec();

        // return message that playlist was deleted
        return res
            .status(200)
            .json({message: `Playlist with id${req.params.id} was deleted`});
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal server error",
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

const list_public = async (req, res) => {
    try {
        // get all public playlists in database
        let playlists = await PlaylistModel.find({publicity: true}).exec();

        // return gotten playlists
        console.log(playlists);
        return res.status(200).json(playlists);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal server error",
            message: err.message,
        });
    }
};

const list_user_playlists = async (req, res) => {
    try {
        const user = await UserModel.findOne({
            _id: req.userId,
        }).exec();

        // get user playlists from database
        let playlists = await UserModel.findById(req.userId)
            .lean()
            .populate("playlists")
            .select("playlists")
            .exec();

        if (user) {
            const spotify_playlists = await getUserPlaylistsSpotify(user);

            for (let i in spotify_playlists) {
                console.log(spotify_playlists[i].id);

                if(playlistContained(spotify_playlists[i].id, playlists.playlists)){
                    // Playlist already included in Database but might need updating
                    console.log("Playlist already included")
                } else {
                    // Playlist does not included yet and has to be created in TeamTune
                    console.log("Spotify Playlist not included yet");
                    console.log(packPlaylist(spotify_playlists[i]));
                    //await create(packPlaylist(spotify_playlists[i]), res);
                }
            }
        }

        return res.status(200).json(playlists.playlists);
    } catch (err) {
        return res.status(500).json({
            error: "Internal Server Error",
            message: err.message,
        });
    }
};

// Check if Spotify Id matches with the spotify id of one of the existing playlists
const playlistContained = (id, playlists) => {
    for (let j in playlists) {
        if (id === playlists[j].spotify_id) {
            return true;
        }
    }
    return false;
}

// creating a object with all relevant data to create a playlist
const packPlaylist = (playlist) => {
    return {
        title: playlist.name,
        publicity: playlist.public,
        spotify_id: playlist.id,
        is_own_playlist: false,
        share_link: "",
        joined_people: [],
        music_info: [],
    }
};

module.exports = {
    create,
    update,
    read,
    remove,
    list,
    list_public,
    list_user_playlists,
};
