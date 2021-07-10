'use strict';
const SHA256 = require('crypto-js/sha256');
const express = require('express');
const { getUserPlaylistsSpotify } = require('../spotifyControllers');
const PlaylistModel = require('../models/playlist');
const UserModel = require('../models/user');
const https = require('https');
const { addSongToPlaylist } = require('../spotifyControllers');
const { getAudioFeaturesForTracks } = require('../spotifyControllers');
const { searchTracksSpotify } = require('../spotifyControllers');
const { getRecommendationsSpotify } = require('../spotifyControllers');
const { getPlaylistSpotify } = require('../spotifyControllers');
const { getAllTrackIDs } = require('../spotifyControllers');
const { followPlaylistSpotify } = require('../spotifyControllers');

const { getAveragePopularity } = require('../spotifyControllers');


const create = async (req, res) => {
    // check if the body of the request contains all necessary properties
    if (Object.keys(req.body).length === 0)
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body is empty'
        });

    // handle the request
    try {
        // create playlist in database
        let playlist = await createPlaylistDatabase(req.body, req.userId);

        // add playlist id to users playlists
        await UserModel.update(
            { _id: req.userId },
            { $addToSet: { playlists: playlist._id } }
        ).exec();
        // return created playlist
        return res.status(201).json(playlist);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
};

const createPlaylistDatabase = async (body, userId) => {
    console.log(body, userId);
    // create playlist in database
    let playlist = await PlaylistModel.create(body);
    // add playlist id to users playlists
    await UserModel.update(
        { _id: userId },
        { $addToSet: { playlists: playlist._id } }
    ).exec();
    return playlist;
};

const update = async (req, res) => {
    // check if the body of the request contains all necessary properties
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body is empty'
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
                runValidators: true
            }
        ).exec();

        // return updated playlist
        return res.status(200).json(playlist);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
};

const updatePlaylistDatabase = async (packPlaylistUpdate) => {
    let playlist = await PlaylistModel.findOneAndUpdate(
        { spotify_id: packPlaylistUpdate.spotify_id },
        packPlaylistUpdate,
        {
            new: true
        }
    ).exec();
    return playlist;
};

const read = async (req, res) => {
    try {
        let playlistId = req.params.id;
        if((req.params.id).length != 24){
            playlistId = await convertPublicToPrivateId(req.params.id);
        }
        // get playlist with id from database
        let playlist = await PlaylistModel.findById(playlistId).exec();

        // if no playlist with id is found, return 404
        if (!playlist)
            return res.status(404).json({
                error: 'Not Found',
                message: `Playlist not found`
            });

        // return gotten playlist
        return res.status(200).json(playlist);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: err.message
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
            .json({ message: `Playlist with id${req.params.id} was deleted` });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message
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
            error: 'Internal server error',
            message: err.message
        });
    }
};

const list_public = async (req, res) => {
    try {
        // get all public playlists in database
        let playlists = await PlaylistModel.find(
            { publicity: true }
        )
            .select('-_id')
            .exec();

        // return gotten playlists
        console.log(playlists);
        return res.status(200).json(playlists);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
};

const list_user_playlists = async (req, res) => {
    try {
        const user = await UserModel.findOne({
            _id: req.userId
        }).exec();

        // get user playlists from database
        let playlists = await UserModel.findById(req.userId)
            .lean()
            .populate('playlists')
            .select('playlists')
            .exec();

        if (user) {
            const spotify_playlists = await getUserPlaylistsSpotify(user);

            for (let i in spotify_playlists) {
                if (playlistContained(spotify_playlists[i].id, playlists.playlists)) {
                    // Playlist already included in Database but might need updating
                    await updatePlaylistDatabase(packPlaylistUpdate(spotify_playlists[i], user.spotify_id, req.userId));
                } else {
                    // Playlist is not included yet and has to be created in TeamTune
                    await createPlaylistDatabase(packPlaylist(spotify_playlists[i], user.spotify_id), req.userId);
                }
            }
        }
        // get user playlists from database
        playlists = await UserModel.findById(req.userId)
            .lean()
            .populate('playlists')
            .select('playlists')
            .exec();

        return res.status(200).json(playlists.playlists);
    } catch (err) {
        console.log('err: ', err);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: err.message
        });
    }
};

async function convertPublicToPrivateId(publicId){
    let playlist = await PlaylistModel.findOne({
        public_id: publicId
    })
        .exec();
    return playlist._id;
}


// Check if Spotify Id matches with the spotify id of one of the existing playlists
const playlistContained = (id, playlists) => {
    for (let j in playlists) {
        if (id === playlists[j].spotify_id) {
            return true;
        }
    }
    return false;
};


/*
SHA256: The slowest, usually 60% slower than md5, and the longest generated hash (32 bytes).
The probability of just two hashes accidentally colliding is approximately: 4.3*10-60.
 */
// creating a object with all relevant data to create a playlist
const packPlaylist = (playlist, spotifyId, userId) => {
    return {
        owner: userId,
        public_id: SHA256(playlist.id).toString(),
        title: playlist.name || 'NO NAME',
        publicity: false,
        spotify_id: playlist.id,
        is_own_playlist: (playlist.owner.id === spotifyId),
        description: playlist.description,
        track_count: playlist.tracks.total,
        image_url: playlist.images[0]?.url || null,
        joined_people: [],
        is_teamtune_playlist: false,
        music_info: {
            durations_ms: 0,
            duration_target: 0,
            songs: [],
            number_songs: 0
        }
    };
};

const packPlaylistUpdate = (playlist, spotifyId, userId) => {
    return {
        owner: userId,
        public_id: SHA256(playlist.id).toString(),
        title: playlist.name || 'NO NAME',
        spotify_id: playlist.id,
        description: playlist.description,
        track_count: playlist.tracks.total,
        image_url: playlist.images[0]?.url || null
    };
};



const getEstimatedAmount = async (req, res) => {
    // retrieve playlist target time and current time
    // song 2 min, 120000 ms
};

const get_Recommendations = async (req, res) => {
    try {
        // ACHTUNG! manchmal auch duplikate, bei aehnlichen Liedern, kann ein song kommen, der schon in der Playlist drin ist.
        console.log('bruder musss los');
        const playlistID = '37i9dQZF1E4Bk7dTDvw6nT';
        const user = await UserModel.findById(req.userId);
        const requestTracks = await getAllTrackIDs(user, playlistID);
        console.log(requestTracks);
        const request = await getRecommendationsSpotify(user, requestTracks, 4);
        console.log("WALLLAAAHHH RECOMMENDs: " + request);
        const requestAllTracks = await getAllTrackIDs(user, playlistID);
        const averagePopularity = await getAveragePopularity(user, playlistID);
        console.log("average Popularity of Playlist: " + averagePopularity);
        if (requestAllTracks.length <= 6) {
            let request = await getRecommendationsSpotify(user, requestAllTracks, 10, averagePopularity);
            console.log('WALLLAAAHHH RECOMMENDs mit weniger gleich 6: ');
            console.log(request);
            return res.status(200).json(request);
        } else {
            let randomSelection = [];
            while (randomSelection.length < 5) {
                let r = Math.floor(Math.random() * requestAllTracks.length) - 1;
                if (randomSelection.indexOf(r) === -1) randomSelection.push(r);
            }
            let trackRandoms = [];
            randomSelection.forEach(number => trackRandoms.push(requestAllTracks[number]));
            let request = await getRecommendationsSpotify(user, trackRandoms, 3);
            console.log('WALLLAAAHHH RECOMMENDs goennt richtig mit random 6: ' );
            console.log(request);
            return res.status(200).json(request);
        }
    } catch (err) {
        console.log('err: ', err);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: err.message
        });
    }

};

const get_Full_List_Recommendations = async (req, res) => {
    // wie get_Recommendations nur in extremo
    // get time left and time now --> multiple get Recomms, with estimator of songs
    // --> average song time?
    // Idee: Rekursiv
}

// if spotify id vorhanden
const get_playlist_time = async (req, res) => {
    try {
        //retrieve playlistID ????? req.params.id not working
        console.log('get rekked: ' + req.params.id);
        const user = await UserModel.findById(req.userId);
        const requestPlaylist = await getPlaylistSpotify(user, '37i9dQZF1DX4wG1zZBw7hm');
        let time = 0;
        for (let i = 0; i < requestPlaylist.tracks.items.length; i++) {
            time += requestPlaylist.tracks.items[i]['track'].duration_ms;
        }
        const timeInMin = (time / 60000);
        console.log("playtime in mins: " + timeInMin);
        return res.status(200).json(timeInMin);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
};

const find_song = async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId);
        const songName = req.params.songname;
        if (songName && user) {
            const request = await searchTracksSpotify(user, songName);
            const songsFiltered = request.body.tracks.items.filter(
                (result) => result.type === 'track'
            );
            const songIds = songsFiltered.map((song) => song.id);
            const audioFeaturesResult = await getAudioFeaturesForTracks(
                user,
                songIds
            );
            const audioFeatures = audioFeaturesResult.body.audio_features;
            const songs = songsFiltered.map((spotifySong) => {
                return {
                    spotify_id: spotifySong.id,
                    name: spotifySong.name,
                    duration_ms: spotifySong.duration_ms,
                    artists: spotifySong.artists.map((artist) => {
                        return {
                            id: artist.id,
                            name: artist.name
                        };
                    }),
                    audio_features: audioFeatures.find(
                        (element) => element.id === spotifySong.id
                    )
                };
            });
            //console.log('songs: ', songs);
            return res.status(200).json(songs);
        }
        return res.status(400);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
};

const add_song = async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId);
        const result = await addSongToPlaylist(
            user,
            req.params.song_id,
            req.params.id
        );
        return res.status(200).json(result.body);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
};

const follow = async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId);
        const playlistId = await convertPublicToPrivateId(req.params.id);
        const playlist = await PlaylistModel.findOne({
            _id: playlistId
        }).exec();
        const result = await followPlaylistSpotify(
            user,
            playlist.spotify_id,
        );
        return res.status(200).json(result.body);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
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
    find_song,
    add_song,
    get_Recommendations,
    get_playlist_time,
    getAllTrackIDs,
    follow,
};
