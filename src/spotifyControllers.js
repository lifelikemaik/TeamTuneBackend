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

async function getAllUserPlaylists(spotifyApi, offset, allPlaylists, firstResponse) {
    //console.log('firstResponse: ', firstResponse);
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
    while (firstResponse.tracks.next) {

    }
}


