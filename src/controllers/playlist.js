'use strict';
const SHA256 = require('crypto-js/sha256');

const { getUserPlaylistsSpotify } = require('../spotifyControllers');
const PlaylistModel = require('../models/playlist');
const UserModel = require('../models/user');
const { startPlayback } = require('../spotifyControllers');
const { unfollowPlaylistSpotify } = require('../spotifyControllers');
const { createPlaylist } = require('../spotifyControllers');
const { addSongToPlaylist } = require('../spotifyControllers');
const { getAudioFeaturesForTracks } = require('../spotifyControllers');
const { getUserNameFromId } = require('../spotifyControllers');
const { searchTracksSpotify } = require('../spotifyControllers');
const { getPlaylistSpotify } = require('../spotifyControllers');
const { getAllTrackIDs } = require('../spotifyControllers');
const { followPlaylistSpotify } = require('../spotifyControllers');
const { getPlaylistAverageInfos } = require('../spotifyControllers');
const { changePlaylistDetails } = require('../spotifyControllers');
const { addMultipleSongsToPlaylist } = require('../spotifyControllers');
const { getFullRecommendations } = require('../spotifyControllers');

const create = async (req, res) => {
    // check if the body of the request contains all necessary properties
    if (Object.keys(req.body).length === 0)
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body is empty',
        });

    // handle the request
    try {
        const playlist = await addPlaylist(req.body, req.userId);
        // return created playlist
        return res.status(201).json(playlist);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message,
        });
    }
};

/**
 * Backend logic when adding playlist (Adding it to user model, create and link public_id and Spotify Playlist/spotify_id)
 * @param playlist playlist object from request
 * @param userId current user id
 * @returns {Promise<*>} Promise with finished playlist
 */
const addPlaylist = async (playlist, userId) => {
    // create playlist in database
    let createdPlaylist = await createPlaylistDatabase(playlist, userId);

    // add playlist id to users playlists
    let user_playlists = await UserModel.update(
        { _id: userId },
        { $addToSet: { playlists: createdPlaylist._id } }
    ).exec();

    // Add public_id to newly created playlist, also add owner
    const public_id = SHA256(createdPlaylist._id).toString();
    createdPlaylist = await updatePlaylistDatabase(createdPlaylist._id, {
        public_id: public_id,
        owner: userId,
    });

    // Create playlist on spotify and link it on model
    const user = await UserModel.findOne({
        _id: userId,
    }).exec();
    const spotifyPlaylist = await createPlaylist(user, createdPlaylist.title);
    const spotifyId = spotifyPlaylist.id;
    createdPlaylist = await updatePlaylistDatabase(createdPlaylist._id, {
        spotify_id: spotifyId,
    });

    return createdPlaylist;
};

const copy = async (req, res) => {
    let playlistId = req.params.id;
    if (req.params.id.length !== 24) {
        playlistId = await convertPublicToPrivateId(req.params.id);
    }
    const userId = req.userId;
    try {
        const user = await UserModel.findOne({
            _id: req.userId,
        }).exec();
        const playlist = await PlaylistModel.findById(playlistId).lean().exec();
        // Configure new parameter that need to change
        delete playlist._id;
        playlist.is_teamtune_playlist = true;
        playlist.is_own_playlist = true;
        playlist.publicity = false;

        const newPlaylist = await addPlaylist(playlist, userId);
        const tracksToCopy = await getAllTrackIDs(user, playlist.spotify_id);
        const numberTracks = tracksToCopy.length;
        const requests = [];
        for (let i = 0; i < numberTracks; i+=100) {
            const promise = new Promise( (resolve, reject) => {
                const arraySection = tracksToCopy.slice(i, i + 100);
                addMultipleSongsToPlaylist(
                    user,
                    arraySection,
                    newPlaylist.spotify_id
                );
                resolve();
            })
            requests.push(promise);
        }
        await Promise.all(requests);
        const publicId = SHA256(newPlaylist._id).toString();
        newPlaylist.publicId = publicId;
        const updatedPlaylist = await updatePlaylistDatabase(newPlaylist._id, newPlaylist);

        return res.status(201).json(updatedPlaylist);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message,
        });
    }
};

const createPlaylistDatabase = async (body, userId) => {
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
            message: 'The request body is empty',
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

        // If publicity was changed, update connected spotify playlist accordingly
        if ('publicity' in req.body && playlist.spotify_id) {
            const user = await UserModel.findOne({
                _id: req.userId,
            }).exec();
            await changePlaylistDetails(user, playlist.spotify_id, {
                public: req.body.publicity,
            });
        }

        // return updated playlist
        return res.status(200).json(playlist);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message,
        });
    }
};

const updatePlaylistDatabaseWithSpotifyId = async (packPlaylistUpdate) => {
    let playlist = await PlaylistModel.findOneAndUpdate(
        { spotify_id: packPlaylistUpdate.spotify_id },
        packPlaylistUpdate,
        {
            new: true,
        }
    ).exec();
    return playlist;
};

const updatePlaylistDatabase = async (id, packPlaylistUpdate) => {
    let playlist = await PlaylistModel.findByIdAndUpdate(
        id,
        packPlaylistUpdate,
        {
            new: true,
        }
    ).exec();
    return playlist;
};

const read = async (req, res) => {
    try {
        let playlistId = req.params.id;
        if (req.params.id.length != 24) {
            playlistId = await convertPublicToPrivateId(req.params.id);
        }
        // get playlist with id from database
        let playlist = await PlaylistModel.findById(playlistId).lean().exec();
        // if no playlist with id is found, return 404
        if (!playlist)
            return res.status(404).json({
                error: 'Not Found',
                message: `Playlist not found`,
            });
        // If spotify playlist is linked, fetch all the songs and add them to the object being returned
        if (playlist.spotify_id) {
            const user = await UserModel.findOne({
                _id: req.userId,
            }).exec();
            const playlistSpotify = await getPlaylistSpotify(
                user,
                playlist.spotify_id
            );
            const songs = await read_helper(user, playlistSpotify);
            playlist.music_info.songs = songs;
        }

        // return gotten playlist
        return res.status(200).json(playlist);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: err.message,
        });
    }
};

const read_invited = async (req, res) => {
    try {
        let playlistId = req.params.id;
        if (req.params.id.length !== 24) {
            playlistId = await convertPublicToPrivateId(req.params.id);
        }
        // get playlist with id from database
        let playlist = await PlaylistModel.findById(playlistId).lean().exec();
        // if no playlist with id is found, return 404
        if (!playlist)
            return res.status(404).json({
                error: 'Not Found',
                message: `Playlist not found`,
            });
        // If spotify playlist is linked, fetch all the songs and add them to the object being returned
        if (playlist.spotify_id) {
            const user = await UserModel.findById(playlist.owner).exec();
            if (user) {
                const playlistSpotify = await getPlaylistSpotify(
                    user,
                    playlist.spotify_id
                );
                const songs = await read_helper(user, playlistSpotify);
                playlist.music_info.songs = songs;
            } else {
                return res.status(400);
            }
        }
        // return gotten playlist
        return res.status(200).json(playlist);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message,
        });
    }
};

const read_helper = async (user, playlistSpotify) => {
    const songs = playlistSpotify.tracks.items.map((song) => {
        return {
            id: song.track.id,
            interpret: song.track.artists
                .map((artist) => artist.name)
                .join(', '),
            album: song.track.album.name,
            title: song.track.name,
            added_by: song.added_by.id,
            duration_ms: song.track.duration_ms,
            image_url: song.track.album.images[0]?.url,
        };
    });

    //Map user ids to names
    const ids = [...new Set(songs.map((song) => song.added_by))];
    const dictionary = {};
    for (const id of ids) {
        const userName = await getUserNameFromId(user, id);
        dictionary[id] = userName;
    }
    songs.forEach((song) => {
        song.added_by = dictionary[song.added_by];
    });
    return songs;
};

const remove = async (req, res) => {
    try {
        const playlist = await PlaylistModel.findById(req.params.id).exec();

        // Delete/ unfollow that playlist on spotify
        const user = await UserModel.findOne({
            _id: req.userId,
        }).exec();
        const result = await unfollowPlaylistSpotify(user, playlist.spotify_id);

        if (result) {
            // find and remove playlist
            var deletedPlaylist = await PlaylistModel.findByIdAndRemove(
                req.params.id
            ).exec();
        } else {
            throw new Error('No result from Spotify');
        }

        // return message that playlist was deleted
        return res.status(200).json({
            message: `Playlist with id${deletedPlaylist._id} was deleted`,
            removedPlaylistId: deletedPlaylist._id,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message,
        });
    }
};

const play = async (req, res) => {
    try {
        const songId = req.body.songId;

        // Get the proper id in case it's accessed from browse
        let playlistId = req.params.id;
        if (req.params.id.length !== 24) {
            playlistId = await convertPublicToPrivateId(req.params.id);
        }

        // create the uri to play
        const playlist = await PlaylistModel.findById(playlistId).exec();
        const uri = songId ? null : `spotify:playlist:${playlist.spotify_id}`;

        const songUris = songId ? [`spotify:track:${songId}`] : null;

        // Play the playlist
        const user = await UserModel.findOne({
            _id: req.userId,
        }).exec();
        const result = await startPlayback(user, uri, songUris);

        // return message that playlist was played
        return res
            .status(200)
            .json({ message: 'Started playback', playlistId: playlistId });
    } catch (err) {
        const error = err.body.error;
        return res.status(500).json({
            error: error.message || 'Internal server error',
            message: error.message,
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
            message: err.message,
        });
    }
};

const list_public = async (req, res) => {
    try {
        // get all public playlists in database

        let playlists = await PlaylistModel.find({
            publicity: true,
            is_teamtune_playlist: true,
        })
            .select('-_id')
            .exec();

        // return gotten playlists
        return res.status(200).json(playlists);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
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
            .populate('playlists')
            .select('playlists')
            .exec();

        if (user) {
            const spotify_playlists = await getUserPlaylistsSpotify(user);

            for (let i in spotify_playlists) {
                if (
                    playlistContained(
                        spotify_playlists[i].id,
                        playlists.playlists
                    )
                ) {
                    // Playlist already included in Database but might need updating
                    await updatePlaylistDatabaseWithSpotifyId(
                        packPlaylistUpdate(
                            spotify_playlists[i],
                            user.spotify_id,
                            req.userId
                        )
                    );
                } else {
                    // Playlist is not included yet and has to be created in TeamTune
                    await createPlaylistDatabase(
                        packPlaylist(spotify_playlists[i], user.spotify_id),
                        req.userId
                    );
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
            message: err.message,
        });
    }
};

async function convertPublicToPrivateId(publicId) {
    let playlist = await PlaylistModel.findOne({
        public_id: publicId,
    }).exec();
    return playlist._id;
}

// Check if playlist creator matches users spotify id
const is_user_playlist = (ownerId, spotifyId) => {
    return ownerId === spotifyId;
};

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
        publicity: playlist.public,
        spotify_id: playlist.id,
        is_own_playlist: playlist.owner.id === spotifyId,
        description: playlist.description,
        track_count: playlist.tracks.total,
        image_url: playlist.images[0]?.url || null,
        joined_people: [],
        is_teamtune_playlist: false,
        music_info: {
            durations_ms: 0,
            duration_target: playlist.music_info?.duration_target || 0,
            songs: [],
        },
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
        image_url: playlist.images[0]?.url || null,
        publicity: playlist.public,
    };
};

const get_Full_List_Recommendations = async (req, res) => {
    try {
        let playlistId = req.params.id;
        const playlist = await PlaylistModel.findById(playlistId).lean().exec();
        const playlistID = playlist.spotify_id;
        const user = await UserModel.findById(req.userId);
        const allTracks = await getAllTrackIDs(user, playlistID);
        const averagePlaylistInfos = await getPlaylistAverageInfos(
            user,
            playlistID
        );
        const lowerEndEstimate = averagePlaylistInfos[3] * 1000 * 60 * 3; //Estimate how long the playlist is if songs > 100
        const averagePopularity = averagePlaylistInfos[0];
        const averageTrackDuration = averagePlaylistInfos[1];
        const currentDuration = Math.max(averagePlaylistInfos[2], lowerEndEstimate);
        let trackSelection = [];
        const maxTime = playlist.music_info.duration_target;

        if (currentDuration > maxTime) {
            return res.status(400).json({
                error: 'Max duration reached'
            });
        }

        const limitRequest = Math.ceil(
            (maxTime - currentDuration) / averageTrackDuration
        );
        if (allTracks.length < 6) {
            trackSelection = [...allTracks];
        }
        const requests = [];
        let limitLeft = limitRequest;
        for (let i = 0; i < Math.ceil(limitRequest / 100); i++) {
            trackSelection = allTracks.length < 6 ? trackSelection : getRandomTracks(allTracks);
            const promise = new Promise(async (resolve, reject) => {
                const result = await getFullRecommendations(
                    user,
                    trackSelection,
                    limitLeft,
                    averagePopularity,
                    allTracks,
                    currentDuration,
                    maxTime,
                    playlistID
                );
                resolve(result);
            });
            limitLeft -= 100;
            requests.push(promise);
        }

        const results = await Promise.all(requests);
        return res.status(200).json(results[results.length - 1]);
    } catch (err) {
        console.log('err: ', err);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: err.message,
        });
    }
};

function getRandomTracks(allTracks) {
    const trackSelection = [];
    const randomIndexSelection = [];
    while (randomIndexSelection.length < 5) {
        let r = Math.floor(Math.random() * allTracks.length);
        if (randomIndexSelection.indexOf(r) === -1) randomIndexSelection.push(r);
    }
    randomIndexSelection.forEach((number) =>
        trackSelection.push(allTracks[number])
    );
    return trackSelection;
}

// if spotify id vorhanden
const get_playlist_time = async (req, res) => {
    try {
        let playlistId = req.params.id;
        if (req.params.id.length !== 24) {
            playlistId = await convertPublicToPrivateId(req.params.id);
        }
        const playlist = await PlaylistModel.findById(playlistId).lean().exec();
        const playlistID = playlist.spotify_id;
        const user = await UserModel.findById(req.userId);
        const requestPlaylist = await getPlaylistSpotify(user, playlistID);
        let time = 0;
        for (let i = 0; i < requestPlaylist.tracks.items.length; i++) {
            time += requestPlaylist.tracks.items[i]['track'].duration_ms;
        }
        const timeInMin = time / 60000;
        //frontend converts time in minutes
        return res.status(200).json(time);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message,
        });
    }
};

const find_song_invited = async (req, res) => {
    try {
        const playlistId = req.params.id;
        const playlist = await PlaylistModel.findById(playlistId);
        const owner = await UserModel.findById(playlist.owner);
        const songName = req.params.songname;

        if (songName && owner) {
            const songs = await find_song_helper(owner, songName);
            return res.status(200).json(songs);
        }
        return res.status(400);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message,
        });
    }
};

const find_song = async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId);
        const songName = req.params.songname;
        if (songName && user) {
            const songs = await find_song_helper(user, songName);
            return res.status(200).json(songs);
        }
        return res.status(400);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message,
        });
    }
};

const find_song_helper = async (user, songName) => {
    try {
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
                image_url: spotifySong.album.images[0]?.url,
                name: spotifySong.name,
                duration_ms: spotifySong.duration_ms,
                explicit: spotifySong.explicit,
                artists: spotifySong.artists.map((artist) => {
                    return {
                        id: artist.id,
                        name: artist.name,
                    };
                }),
                audio_features: audioFeatures.find(
                    (element) => element.id === spotifySong.id
                ),
            };
        });
        return songs;
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message,
        });
    }
};

const add_song_invited = async (req, res) => {
    try {
        const playlistId = req.params.id;
        const playlist = await PlaylistModel.findOne({
            spotify_id: playlistId,
        });
        const owner = await UserModel.findById(playlist.owner);
        const songs = await addSongToPlaylist(
            owner,
            req.params.song_id,
            playlistId
        );
        return res.status(200).json(songs.body);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message,
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
            message: err.message,
        });
    }
};

const follow = async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId);
        const playlistId = await convertPublicToPrivateId(req.params.id);
        const playlist = await PlaylistModel.findOne({
            _id: playlistId,
        }).exec();
        const result = await followPlaylistSpotify(user, playlist.spotify_id);
        return res.status(200).json(result.body);
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
    copy,
    update,
    read,
    read_invited,
    remove,
    list,
    list_public,
    list_user_playlists,
    find_song,
    find_song_invited,
    add_song,
    add_song_invited,
    get_playlist_time,
    getAllTrackIDs,
    get_Full_List_Recommendations,
    follow,
    play,
};
