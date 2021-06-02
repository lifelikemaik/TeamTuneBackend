"use strict";
const SpotifyWebApi = require('spotify-web-api-node');
const open = require('open');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const config = require("../config");
const UserModel = require("../models/user");

const login = async (req, res) => {
    // check if the body of the request contains all necessary properties
    if (!Object.prototype.hasOwnProperty.call(req.body, "password"))
        return res.status(400).json({
            error: "Bad Request",
            message: "The request body must contain a password property",
        });

    if (!Object.prototype.hasOwnProperty.call(req.body, "username"))
        return res.status(400).json({
            error: "Bad Request",
            message: "The request body must contain a username property",
        });

    // handle the request
    try {
        // get the user form the database
        let user = await UserModel.findOne({
            username: req.body.username,
        }).exec();

        // check if the password is valid
        const isPasswordValid = bcrypt.compareSync(
            req.body.password,
            user.password
        );
        if (!isPasswordValid) return res.status(401).send({ token: null });

        // if user is found and password is valid
        // create a token
        const token = jwt.sign(
            { _id: user._id, username: user.username, role: user.role },
            config.JwtSecret,
            {
                expiresIn: 86400, // expires in 24 hours
            }
        );

        return res.status(200).json({
            token: token,
        });
    } catch (err) {
        return res.status(404).json({
            error: "User Not Found",
            message: err.message,
        });
    }
};

const callback = async (req, res) => {
    
}

const register = async (req, res) => {
    // check if the body of the request contains all necessary properties
    if (!Object.prototype.hasOwnProperty.call(req.body, "password"))
        return res.status(400).json({
            error: "Bad Request",
            message: "The request body must contain a password property",
        });

    if (!Object.prototype.hasOwnProperty.call(req.body, "username"))
        return res.status(400).json({
            error: "Bad Request",
            message: "The request body must contain a username property",
        });

    // handle the request
    try {
        // hash the password before storing it in the database
        const hashedPassword = bcrypt.hashSync(req.body.password, 8);

        // https://accounts.spotify.com/de/login?continue=https:%2F%2Faccounts.spotify.com%2Fauthorize%3Fscope%3Duser-read-private%2Buser-read-email%2Buser-library-read%2Buser-library-modify%2Bplaylist-read-collaborative%2Bplaylist-read-private%2Bplaylist-modify-private%2Bplaylist-modify-public%26response_type%3Dcode%26redirect_uri%3Dhttp%253A%252F%252Flocalhost%253A8888%252F%26state%3DMBi9JmuQyA8agrbo%26client_id%3D13fc26a1aa724752953370044913e510
        // example auth link
        
        const scopes = ['user-read-private', 'user-read-email', 'user-library-read', 'user-library-modify', 'playlist-read-collaborative', 'playlist-read-private', 'playlist-modify-private', 'playlist-modify-public']
        const state = generateRandomString(16);
        const spotifyApi = new SpotifyWebApi({
            clientId: config.client_id,
            redirectUri: 'http://localhost:3000/callback'
          });
        const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
        console.log(authorizeURL);

        open(authorizeURL); // --> close previous window --> frontend triggern!!!

        /*
            Callback bekommt response, token bekkomen und speichern, mit user login 
        */
        // create a user object
        
        // code wird nur einmal verwendet und nicht zweimal, durch code bekommt man 

        const user = {
            username: req.body.username,
            password: hashedPassword,
            role: req.body.isAdmin ? "admin" : "member",
            code: String,
            state: state,
            access_token: String,
            token_type: String,
            refresh_token: String
        };

        // create the user in the database
        let retUser = await UserModel.create(user);

        // if user is registered without errors
        // create a token
        const token = jwt.sign(
            {
                _id: retUser._id,
                username: retUser.username,
                role: retUser.role,
                state: retUser.state,
            },
            config.JwtSecret,
            {
                expiresIn: 86400, // expires in 24 hours
            }
        );

        // return generated token
        res.status(200).json({
            token: token,
        });
        console.log(token);
        // console.log(res);
    } catch (err) {
        if (err.code == 11000) {
            return res.status(400).json({
                error: "User exists",
                message: err.message,
            });
        } else {
            return res.status(500).json({
                error: "Internal server error",
                message: err.message,
            });
        }
    }
};

const me = async (req, res) => {
    try {
        // get own user name from database
        let user = await UserModel.findById(req.userId)
            .select("username")
            .exec();

        if (!user)
            return res.status(404).json({
                error: "Not Found",
                message: `User not found`,
            });

        return res.status(200).json(user);
    } catch (err) {
        return res.status(500).json({
            error: "Internal Server Error",
            message: err.message,
        });
    }
};

const logout = (req, res) => {
    res.status(200).send({ token: null });
};

var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

function getCode() {
    let code = null;
    const queryString = window.location.search
    if(queryString.length > 0){
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code')
    }
    return code;
}
  

module.exports = {
    login,
    register,
    logout,
    me,
};
