"use strict";
const SpotifyWebApi = require('spotify-web-api-node');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const config = require("../config");
const UserModel = require("../models/user");

const registerSpotify = async (req, res) => {
    var code  = req.query.code; // Read the authorization code from the query parameters
    var state = req.query.state; // (Optional) Read the state from the query parameters
    res.redirect("http://teamtune.fun/register?isLinked=true&code=" + code);
}

function connect(accessToken, useCase){
    // only use with valid token
    var spotifyApi = new SpotifyWebApi({
        clientId: config.client_id,
        clientSecret: config.client_secret,
        redirectUri: 'http://localhost:4000/callback/login'
    });
    spotifyApi.setAccessToken(accessToken);
    return spotifyApi;
}

/*
const connection = connect (user.access_token);
connection.getPlaylist(id);

 */




module.exports = {
    registerSpotify,
    connect,
};