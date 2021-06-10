"use strict";
const SpotifyWebApi = require('spotify-web-api-node');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const config = require("../config");
const UserModel = require("../models/user");
  

const registerSpotify = async (req, res) => {
    var code  = req.query.code; // Read the authorization code from the query parameters
    var state = req.query.state; // (Optional) Read the state from the query parameters
    res.redirect("http://localhost:3000/register?isLinked=true&code=" + code);
    
} 

module.exports = {
  registerSpotify,
};
