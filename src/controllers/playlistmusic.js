'use strict';

const PlaylistMusicModel = require('../models/playlistmusic');
const PlaylistModel = require('../models/playlist');

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
        console.log('req.params.id: ', req.params.id);
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
        // find playlist
        let playlist = await PlaylistModel.findById(req.params.id).exec();

        // Map Song objects to their id to be able to search it
        const idMap = playlist.music_info.songs.map(function (e) {
            return '' + e._id;
        });
        // Index is -1 if no song with song_id exists
        const index = idMap.indexOf(req.params.song_id);

        let deletedSong;
        if (index > -1) {
            deletedSong = playlist.music_info.songs[index];
            playlist.music_info.songs.splice(index, 1);
        }
        // TODO: Update all the other parameters

        playlist.save();

        // return message that song was deleted
        if (deletedSong) {
            return res
                .status(200)
                .json({ message: `Song with id${req.params.id} was deleted` });
        } else {
            return res.status(404).json({
                error: 'Not Found',
                message: `Song with id${req.params.id} was not found in playlist`,
            });
        }
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
