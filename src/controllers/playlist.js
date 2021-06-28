"use strict";

const PlaylistModel = require("../models/playlist");
const UserModel = require("../models/user");
const express = require("express");
const {getUserPlaylistsSpotify} = require("../spotifyControllers");
const https = require('https');
const {addSongToPlaylist} = require("../spotifyControllers");
const {getAudioFeaturesForTracks} = require("../spotifyControllers");
const {searchTracksSpotify} = require("../spotifyControllers");



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
        let playlist = await createPlaylistDatabase(req.body, req.userId)

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

const createPlaylistDatabase = async (body, userId) => {
    console.log(body, userId)
    // create playlist in database
    let playlist = await PlaylistModel.create(body);
    // add playlist id to users playlists
    await UserModel.update(
        {_id: userId},
        {$addToSet: {playlists: playlist._id}}
    ).exec();
    return playlist;
}

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

const updatePlaylistDatabase = async (packPlaylistUpdate) => {
    let playlist = await PlaylistModel.findOneAndUpdate(
        {spotify_id: packPlaylistUpdate.spotify_id},
        packPlaylistUpdate,
        {
            new: true,
        }
    ).exec();
    return playlist;
}

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
                if(playlistContained(spotify_playlists[i].id, playlists.playlists)){
                    // Playlist already included in Database but might need updating
                    await updatePlaylistDatabase(packPlaylistUpdate(spotify_playlists[i], user.spotify_id));
                } else {
                    // Playlist is not included yet and has to be created in TeamTune
                    await createPlaylistDatabase(packPlaylist(spotify_playlists[i], user.spotify_id), req.userId);
                }
            }
        }
        // get user playlists from database
        playlists = await UserModel.findById(req.userId)
            .lean()
            .populate("playlists")
            .select("playlists")
            .exec();

        return res.status(200).json(playlists.playlists);
    } catch (err) {
        return res.status(500).json({
            error: "Internal Server Error",
            message: err.message,
        });
    }
};



// Check if playlist creator matches users spotify id
const is_user_playlist = (ownerId, spotifyId) => {
    return (ownerId === spotifyId);
}

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
const packPlaylist = (playlist, spotifyId) => {
    return {
        title: playlist.name || "NO NAME",
        publicity: false,
        spotify_id: playlist.id,
        is_own_playlist: (playlist.owner.id === spotifyId),
        description: playlist.description,
        track_count: playlist.tracks.total,
        share_link: "",
        image_url: playlist.images[0].url,
        joined_people: [],
        is_teamtune_playlist: false,
        music_info: {
            durations_ms: 0,
            duration_target: 0,
            songs: [],
            number_songs: 0,
        },
    }
};

const packPlaylistUpdate = (playlist, spotifyId) => {
    return {
        title: playlist.name || "NO NAME",
        publicity: false,
        spotify_id: playlist.id,
        description: playlist.description,
        track_count: playlist.tracks.total,
        image_url: playlist.images[0].url,
    }
};

const find_song = async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId);
        const songName = req.params.songname;
        console.log('songName: ', songName);
        if (songName && user) {
            const request = await searchTracksSpotify(user, songName);
            //console.log('request.body.tracks.items: ', request.body.tracks.items);
            const songsFiltered = request.body.tracks.items.filter((result) => result.type === 'track');
            const songIds = songsFiltered.map(song => song.id);
            console.log('songIds: ', songIds);
            const audioFeaturesResult = await getAudioFeaturesForTracks(user, songIds);
            const audioFeatures = audioFeaturesResult.body.audio_features;
            console.log('audioFeatures: ', audioFeatures);
            const songs = songsFiltered
                .map((spotifySong) => {
                    return {
                        spotify_id: spotifySong.id,
                        name: spotifySong.name,
                        duration_ms: spotifySong.duration_ms,
                        artists: spotifySong.artists.map((artist) => {return {
                            id: artist.id,
                            name: artist.name,
                        }}),
                        audio_features: audioFeatures.find(element => element.id === spotifySong.id),
                    }
            });
            //console.log('songs: ', songs);
            return res.status(200).json(songs);
        }
        return res.status(400);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal server error",
            message: err.message,
        });
    }
}

const add_song = async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId);
        const result = await addSongToPlaylist(user, req.params.song_id, req.params.id)
        return res.status(200).json(result.body);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: "Internal server error",
            message: err.message,
        });

    }
}


module.exports = {
    create,
    update,
    read,
    remove,
    list,
    list_public,
    list_user_playlists,
    find_song,
    add_song
};
