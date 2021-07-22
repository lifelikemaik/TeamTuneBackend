'use strict';

const PlaylistMusicModel = require('../models/playlistmusic');
const PlaylistModel = require('../models/playlist');
const UserModel = require('../models/user');
const { removeSongFromPlaylist } = require('../spotifyControllers');

const create = async (req, res) => {
    // check if the body of the request contains all necessary properties
    if (Object.keys(req.body).length === 0)
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body is empty',
        });

    // handle the request
    try {
        // Find the playlist we want to update
        let playlist = await PlaylistModel.findById(req.params.id).exec();
        playlist.music_info.songs.push(req.body);
        // TODO: Update all the other parameters

        playlist.save();

        // return updated playlist
        return res.status(201).json(playlist);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message,
        });
    }
};

const remove = async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId);
        const playlist = await PlaylistModel.findById(req.params.id);
        const spotifyResponse = await removeSongFromPlaylist(
            user,
            [req.params.song_id],
            playlist.spotify_id
        );
        console.log('spotifyResponse: ', spotifyResponse);
        if (spotifyResponse) return res.status(200).json({removedSongId: req.params.song_id});
        else return res.status(400);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message,
        });
    }
};

module.exports = {
    create,
    remove,
};
