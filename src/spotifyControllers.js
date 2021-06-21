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
    getPlaylistSpotify: async function (user, playlistId) {
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.')
            return null;
        }
        const spotifyApi = authenticateAPI(user);

        // Get a playlist
        return new Promise(function (resolve, reject) {
            spotifyApi.getPlaylist(playlistId, {limit: 100})
                .then(function(data) {
                    resolve(data.body);
                    //console.log('Some information about this playlist', data.body);
                }, function(err) {
                    console.log('Something went wrong!', err);
                    reject(err);
                });
        })
    },
    /**
     * returns all Playlists of a user
     * @param user the user object which needs to have an access_token and refresh_token
     * @returns {Promise<unknown>} Promise containing a list of all playlists
     */
    getUserPlaylistsSpotify: async function (user) {
        if (!user || !user.access_token || !user.refresh_token) {
            console.log('Incorrect user object passed.')
            return null;
        }
        const spotifyApi = authenticateAPI(user);

        return new Promise(function (resolve, reject) {
            spotifyApi.getUserPlaylists(undefined)
                .then(async function (data) {
                    const allPlaylists = await getAllUserPlaylists(spotifyApi, 0, [], data.body);
                    resolve(allPlaylists);
                    //console.log('Some information about this playlist', data.body);
                }, function(err) {
                    console.log('Something went wrong!', err);
                    reject(err);
                });
        });

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
    console.log('firstResponse.next: ', !!firstResponse.next);
    while (!!firstResponse?.next) {
        console.log('looping');
        allPlaylists = allPlaylists.concat(firstResponse.items);
        offset += 20;
        firstResponse = await spotifyApi.getUserPlaylists(undefined, {limit: 20, offset: offset});
        console.log('firstResponse1: ', firstResponse);
        firstResponse = firstResponse?.body;
        console.log('firstResponse2: ', firstResponse);
    }
    allPlaylists = allPlaylists.concat(firstResponse.items);
    return allPlaylists;
}

async function getAllTracks(requestFunction, offset, allTracks, firstResponse) {
    while (!!firstResponse?.tracks?.next) {

    }
}


