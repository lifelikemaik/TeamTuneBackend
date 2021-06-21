"use strict";
const SpotifyWebApi = require('spotify-web-api-node');
const config = require("./config");

module.exports = {
    getPlaylistSpotify: async function (user, playlistId) {
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
    getUserPlaylistsSpotify: async function (user) {
        const spotifyApi = authenticateAPI(user);

        return new Promise(function (resolve, reject) {
            spotifyApi.getUserPlaylists(undefined)
                .then(function(data) {
                    resolve(data.body);
                    //console.log('Some information about this playlist', data.body);
                }, function(err) {
                    console.log('Something went wrong!', err);
                    reject(err);
                });
        });

    },
}

async function getAllTracks(requestFunction, offset, allTracks, firstResponse) {
    while (firstResponse.tracks.next) {

    }
}

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
