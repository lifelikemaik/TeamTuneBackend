"use strict";
const SpotifyWebApi = require('spotify-web-api-node');
const config = require("./config");

function authenticateAPI(user) {
    const spotifyApi = new SpotifyWebApi();
    spotifyApi.setCredentials({
        clientId: config.client_id,
        clientSecret: config.client_secret,
        redirectUri: 'http://localhost:4000/callback/login',
        refreshToken: user.refresh_token,
        accessToken: user.access_token
    });
    return spotifyApi;
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
            console.log('Incorrect user object passed.')
            return null;
        }
        const spotifyApi = authenticateAPI(user);

        // Get a playlist
        const data = await spotifyApi.getPlaylist(playlistId, {limit: 100});
        const tracks = await spotifyApi.getPlaylistTracks(playlistId);
        const allTracks = await getAllTracks(spotifyApi, playlistId, 0, [], tracks.body);
        data.body.tracks.items = allTracks;
        return data.body;

        /* Alternative way with then and Promise:
        return new Promise(function (resolve, reject) {
            spotifyApi.getPlaylist(playlistId, {limit: 100})
                .then(async function (data) {
                    const tracks = await spotifyApi.getPlaylistTracks(playlistId);
                    const allTracks = await getAllTracks(spotifyApi, playlistId, 0, [], tracks.body);
                    data.body.tracks.items = allTracks;
                    resolve(data.body);
                }, function(err) {
                    console.log('Something went wrong!', err);
                    reject(err);
                });
        })
         */
    },
    /**
     * returns all Playlists of a user
     * @param user the user object which needs to have an access_token and refresh_token
     * @returns {Promise<unknown>} Promise containing a list of all playlists
     */
    getUserPlaylistsSpotify: async function (user) {
        // Make sure spotify authentication works
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.')
            return null;
        }
        const spotifyApi = authenticateAPI(user);

        const data = await spotifyApi.getUserPlaylists(undefined);
        const allPlaylists = await getAllUserPlaylists(spotifyApi, 0, [], data.body);
        return allPlaylists;

        /*
        // Alternative way with then and Promise:
        return new Promise(function (resolve, reject) {
            spotifyApi.getUserPlaylists(undefined)
                .then(async function (data) {
                    const allPlaylists = await getAllUserPlaylists(spotifyApi, 0, [], data.body);
                    resolve(allPlaylists);
                }, function(err) {
                    console.log('Something went wrong!', err);
                    reject(err);
                });
        });
         */
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
            console.log('Incorrect user object passed.')
            return null;
        }
        const spotifyApi = authenticateAPI(user);

        const result = await spotifyApi.followPlaylist(playlistId);
        console.log(result);
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
            console.log('Incorrect user object passed.')
            return null;
        }
        const spotifyApi = authenticateAPI(user);

        const result = await spotifyApi.searchTracks(trackName);
        return result;
    },
}

/**
 * concats playlists through pagination of Spotify API
 * @param spotifyApi
 * @param offset current offset (start 0)
 * @param allPlaylists all Playlists (start [])
 * @param firstResponse response of the first request
 * @returns {Promise<*>} Promise containing array of all playlists
 */
async function getAllUserPlaylists(spotifyApi, offset, allPlaylists, firstResponse) {
    while (!!firstResponse?.next) {
        allPlaylists = allPlaylists.concat(firstResponse.items);
        offset += 20;
        firstResponse = await spotifyApi.getUserPlaylists(undefined, {limit: 20, offset: offset});
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
async function getAllTracks(spotifyApi, playlistId, offset, allTracks, firstResponse) {
    while (!!firstResponse?.next) {
        allTracks = allTracks.concat(firstResponse.items);
        offset += 100;
        firstResponse = await spotifyApi.getPlaylistTracks(playlistId, { limit: 100, offset: offset})
        firstResponse = firstResponse.body;
    }
    allTracks = allTracks.concat(firstResponse.items);
    return allTracks;
}


