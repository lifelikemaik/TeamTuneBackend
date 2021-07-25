'use strict';
const SpotifyWebApi = require('spotify-web-api-node');
const config = require('./config');

// NPM LINK: https://www.npmjs.com/package/spotify-web-api-node

function authenticateAPI(user) {
    const spotifyApi = new SpotifyWebApi();
    spotifyApi.setCredentials({
        clientId: config.client_id,
        clientSecret: config.client_secret,
        redirectUri: 'http://localhost:4000/callback/login',
        refreshToken: user.refresh_token,
        accessToken: user.access_token,
    });
    const now = new Date();
    const tokenRefreshEarly = new Date(now.getTime() + 30 * 60000);
    if (tokenRefreshEarly >= user.token_refreshdate) {
        const tokenExpired = new Date(now.getTime() + 60 * 60000);
        spotifyApi.refreshAccessToken().then(
            function (data) {
                spotifyApi.setAccessToken(data.body['access_token']);
                user.set('access_token', data.body['access_token']);
                user.set('token_refreshdate', tokenExpired);
                user.save();
            },
            function (err) {
                console.log('Could not refresh access token', err);
            }
        );
        return spotifyApi;
    } else {
        return spotifyApi;
    }
}

module.exports = {
    /**
     * Gets a playlist with all its tracks
     * @param user
     * @param playlistId
     * @returns {Promise<null|*>} Promise of playlist object
     */
    getPlaylistSpotify: async function (user, playlistId) {
        // Make sure spotify authentication works
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.');
            return null;
        }
        const spotifyApi = authenticateAPI(user);
        try {
            // Get a playlist
            const data = await spotifyApi.getPlaylist(playlistId, {
                limit: 100,
            });
            const tracks = await spotifyApi.getPlaylistTracks(playlistId);
            const allTracks = await getAllTracks(
                spotifyApi,
                playlistId,
                0,
                [],
                tracks.body
            );
            data.body.tracks.items = allTracks;
            return data.body;
        } catch (err) {
            console.log(err);
        }
    },
    /**
     * returns all Playlists of a user
     * @param user the user object which needs to have an access_token and refresh_token
     * @returns {Promise<unknown>} Promise containing a list of all playlists
     */
    getUserPlaylistsSpotify: async function (user) {
        // Make sure spotify authentication works
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.');
            return null;
        }
        const spotifyApi = authenticateAPI(user);
        try {
            const data = await spotifyApi.getUserPlaylists(undefined);
            const allPlaylists = await getAllUserPlaylists(
                spotifyApi,
                0,
                [],
                data.body
            );
            return allPlaylists;
        } catch (err) {
            console.log(err);
        }
    },
    /**
     * fetches the username of a spotify user
     * @param user current user
     * @param spotifyId spotifyId of the user the name should be fetched from
     * @returns {Promise<string>} username
     */
    getUserNameFromId: async function (user, spotifyId) {
        // Make sure spotify authentication works
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.');
            return null;
        }
        const spotifyApi = authenticateAPI(user);
        try {
            const user = await spotifyApi.getUser(spotifyId);
            return user.body.display_name;
        } catch (err) {
            console.log(err);
        }
    },
    /**
     * Follows a playlist on spotify
     * @param user current user
     * @param playlistId id of playlist to follow
     * @returns {Promise<*|null>} http response of spotify api
     */
    followPlaylistSpotify: async function (user, playlistId) {
        // Make sure spotify authentication works
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.');
            return null;
        }
        const spotifyApi = authenticateAPI(user);

        try {
            const result = await spotifyApi.followPlaylist(playlistId);
            return result;
        } catch (err) {
            console.log(err);
        }
    },
    /**
     * The closest thing spotify offers to delete, if you unfollow your own playlist it's basically deleted
     * @param user user that unfollows the playlist
     * @param playlistId playlist to unfollow
     * @returns {Promise<*|null>}
     */
    unfollowPlaylistSpotify: async function (user, playlistId) {
        // Make sure spotify authentication works
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.');
            return null;
        }
        const spotifyApi = authenticateAPI(user);

        try {
            const result = await spotifyApi.unfollowPlaylist(playlistId);
            return result;
        } catch (err) {
            console.log(err);
        }
    },
    /**
     * Starts/Resumes a User's Playback, supply either uri for playlist or array of track uris
     * @param user user to start playback from
     * @param uri optional, can be playlist or album uri (spotify:playlist:37i9dQZF1DZ06evO1ROoUO)
     * @param songUris array in format ['spotify:track:5Bm5DIPf976EIbUEoo3j2u']
     * @returns {Promise<*|null>}
     */
    startPlayback: async function (user, uri, songUris) {
        // Make sure spotify authentication works
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.');
            return null;
        }
        const spotifyApi = authenticateAPI(user);

        const options = uri
            ? {
                  context_uri: uri,
              }
            : { uris: songUris };

        const result = await spotifyApi.play(options);
        return result;
    },
    /**
     * Search for tracks on spotify
     * @param user current user
     * @param trackName name of track, album or artist
     * @returns result http response of spotify api
     */
    searchTracksSpotify: async function (user, trackName) {
        // Make sure spotify authentication works
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.');
            return null;
        }
        const spotifyApi = authenticateAPI(user);
        try {
            const result = await spotifyApi.searchTracks(trackName);
            return result;
        } catch (err) {
            console.log(err);
        }
    },
    getAudioFeaturesForTracks: async function (user, trackIds) {
        // Make sure spotify authentication works
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.');
            return null;
        }
        const spotifyApi = authenticateAPI(user);
        try {
            const result = await spotifyApi.getAudioFeaturesForTracks(trackIds);
            return result;
        } catch (err) {
            console.log(err);
        }
    },
    addSongToPlaylist: async function (user, songId, playlistId) {
        // Make sure spotify authentication works
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.');
            return null;
        }
        const spotifyApi = authenticateAPI(user);
        try {
            const uri = 'spotify:track:' + songId;
            const result = await spotifyApi.addTracksToPlaylist(playlistId, [
                uri,
            ]);
            return result;
        } catch (err) {
            console.log(err);
        }
    },
    addMultipleSongsToPlaylist: async function (user, songsIds, playlistId) {
        // Make sure spotify authentication works
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.');
            return null;
        }
        const spotifyApi = authenticateAPI(user);
        try {
            let formattedSongIds = [];
            for (let i = 0; i < songsIds.length; i++) {
                const uri = 'spotify:track:' + songsIds[i];
                formattedSongIds.push(uri);
            }
            return await spotifyApi.addTracksToPlaylist(
                playlistId,
                formattedSongIds
            );
        } catch (err) {
            console.log(err);
        }
    },
    removeSongFromPlaylist: async function (user, songIds, playlistId) {
        const songs = songIds.map((songId) => {
            return {
                uri: 'spotify:track:' + songId,
            };
        });
        // Make sure spotify authentication works
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.');
            return null;
        }
        const spotifyApi = authenticateAPI(user);
        try {
            const result = await spotifyApi.removeTracksFromPlaylist(
                playlistId,
                songs,
                null
            );
            return result.body;
        } catch (err) {
            console.log(err);
        }
    },
    getAllTrackIDs: async function (user, playlistID) {
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.');
            return null;
        }
        const spotifyApi = authenticateAPI(user);
        const request = await spotifyApi.getPlaylist(playlistID);
        const requestPlaylist = request.body;
        const trackSet = new Set(); // remove duplicates with Set
        for (let i = 0; i < requestPlaylist.tracks.items.length; i++) {
            trackSet.add(requestPlaylist.tracks.items[i]['track'].id);
        }
        const tracksArray = Array.from(trackSet);
        return JSON.parse(JSON.stringify(tracksArray));
    },
    getFullRecommendations: async function (
        user,
        tracks,
        limit,
        popularity,
        allTracks,
        currentTime,
        maxTime,
        playlistID
    ) {
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.');
            return null;
        }
        const spotifyApi = authenticateAPI(user);
        let resultIDs = [];
        const data = await spotifyApi.getRecommendations({
            seed_tracks: [tracks],
            limit: Math.min(limit, 100),
            target_popularity: popularity,
            market: 'DE', // only songs available in Germany
        });

        let recommendations = data.body;
        for (let i = 0; i < recommendations.tracks.length; i++) {
            if (!allTracks.includes(recommendations.tracks[i].id)) {
                if (
                    currentTime + recommendations.tracks[i].duration_ms <=
                    maxTime
                ) {
                    resultIDs.push(recommendations.tracks[i].id);
                }
            }
        }
        let formattedSongIds = [];
        for (let i = 0; i < resultIDs.length; i++) {
            const uri = 'spotify:track:' + resultIDs[i];
            formattedSongIds.push(uri);
        }
        const result = await spotifyApi.addTracksToPlaylist(
            playlistID,
            formattedSongIds
        );
        return result.body;
    },

    getPlaylistAverageInfos: async function (user, playlistID) {
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.');
            return null;
        }
        const spotifyApi = authenticateAPI(user);
        const request = await spotifyApi.getPlaylist(playlistID);
        const requestPlaylist = request.body;
        let results = [];
        // [averagePopularity, averageTrackDuration, sumDuration]
        let sumPopularity = 0;
        for (let i = 0; i < requestPlaylist.tracks.items.length; i++) {
            sumPopularity +=
                requestPlaylist.tracks.items[i]['track'].popularity;
        }
        const averagePopularity = Math.floor(
            sumPopularity / requestPlaylist.tracks.items.length
        );
        let sumDuration = 0;
        for (let i = 0; i < requestPlaylist.tracks.items.length; i++) {
            sumDuration += requestPlaylist.tracks.items[i]['track'].duration_ms;
        }
        const averageTrackDuration = Math.floor(
            sumDuration / requestPlaylist.tracks.items.length
        );
        results.push(averagePopularity);
        results.push(averageTrackDuration);
        results.push(sumDuration);
        return results;
    },
    changePlaylistDetails: async function (user, playlistId, details) {
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.');
            return null;
        }
        const spotifyApi = authenticateAPI(user);
        // Make sure spotify authentication works
        try {
            const result = await spotifyApi.changePlaylistDetails(
                playlistId,
                details
            );
            return result;
        } catch (err) {
            console.log(err);
        }
    },
    createPlaylist: async function (user, playlistTitle) {
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.');
            return null;
        }
        const spotifyApi = authenticateAPI(user);
        // Make sure spotify authentication works
        try {
            const result = await spotifyApi.createPlaylist(playlistTitle, {
                public: false,
            });
            return result.body;
        } catch (err) {
            console.log(err);
        }
    },
};

/**
 * concats playlists through pagination of Spotify API
 * @param spotifyApi
 * @param offset current offset (start 0)
 * @param allPlaylists all Playlists (start [])
 * @param firstResponse response of the first request
 * @returns {Promise<*>} Promise containing array of all playlists
 */
async function getAllUserPlaylists(
    spotifyApi,
    offset,
    allPlaylists,
    firstResponse
) {
    while (!!firstResponse?.next) {
        allPlaylists = allPlaylists.concat(firstResponse.items);
        offset += 20;
        firstResponse = await spotifyApi.getUserPlaylists(undefined, {
            limit: 20,
            offset: offset,
        });
        firstResponse = firstResponse?.body;
    }
    allPlaylists = allPlaylists.concat(firstResponse.items);
    return allPlaylists;
}

/**
 * concats all tracks of a playlist through pagination of Spotify API
 * @param spotifyApi
 * @param playlistId
 * @param offset
 * @param allTracks
 * @param firstResponse
 * @returns {Promise<*>} Promise of array with all tracks
 */
//sicher, dass wir das brauchen: https://maikluuba.ch/repo/alltracks.json
// legit nur name vom lied und interpreten --> siehe https://developer.spotify.com/console/get-playlist-tracks/
async function getAllTracks(
    spotifyApi,
    playlistId,
    offset,
    allTracks,
    firstResponse
) {
    while (!!firstResponse?.next) {
        allTracks = allTracks.concat(firstResponse.items);
        offset += 100;
        firstResponse = await spotifyApi.getPlaylistTracks(playlistId, {
            limit: 100,
            offset: offset,
        });
        firstResponse = firstResponse.body;
    }
    allTracks = allTracks.concat(firstResponse.items);
    return allTracks;
}
