'use strict';
const SpotifyWebApi = require('spotify-web-api-node');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('../config');
const UserModel = require('../models/user');
const InvitedUser = require('../models/invitedUser');
const PlaylistModel = require('../models/playlist');

const login = async (req, res) => {
    // check if the body of the request contains all necessary properties
    if (!Object.prototype.hasOwnProperty.call(req.body, 'password'))
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a password property',
        });

    if (!Object.prototype.hasOwnProperty.call(req.body, 'username'))
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a username property',
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

        // get access token and check expiration date
        const now = new Date();
        const tokenExpired = new Date(now.getTime() + 60 * 60000);
        if (now >= user.token_refreshdate) {
            var spotifyApi = new SpotifyWebApi();
            spotifyApi.setCredentials({
                clientId: config.client_id,
                clientSecret: config.client_secret,
                redirectUri: 'https://backend.teamtune.fun/callback/login',
                refreshToken: user.refresh_token,
                accessToken: user.access_token,
            });

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
        }

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
            error: 'User Not Found',
            message: err.message,
        });
    }
};

const register = async (req, res) => {

    // Make sure user with same doesn't exist already (username has to be unique)
    const username = req.body.username;
    const user = await UserModel.findOne({ username: username }).exec();
    if (!!user) {
        return res.status(409).json({
            error: 'User already exists',
            message: 'User already exists'
        });
    }

    // check if the body of the request contains all necessary properties
    if (!Object.prototype.hasOwnProperty.call(req.body, 'password'))
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a password property',
        });

    if (!Object.prototype.hasOwnProperty.call(req.body, 'username'))
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a username property',
        });

    try {
        // hash the password before storing it in the database
        const hashedPassword = bcrypt.hashSync(req.body.password, 8);

        var credentials = {
            clientId: config.client_id,
            clientSecret: config.client_secret,
            redirectUri: 'https://backend.teamtune.fun/callback/register',
        };

        var spotifyApi = new SpotifyWebApi(credentials);

        spotifyApi
            .authorizationCodeGrant(req.body.code)
            .then(
                function (data) {
                    // Set the access token on the API object to use it in later calls
                    spotifyApi.setAccessToken(data.body['access_token']);
                    spotifyApi.setRefreshToken(data.body['refresh_token']);
                },
                function (err) {
                    console.log('Something went wrong!', err);
                }
            )
            .then(async function () {
                // anonymous function for user creation
                const access = spotifyApi.getAccessToken();
                const refresh = spotifyApi.getRefreshToken();
                const spotifyId = await spotifyApi.getMe();
                const now = new Date();
                const tokenexpired = now.setHours(now.getHours() + 1);
                const user = {
                    username: req.body.username,
                    password: hashedPassword,
                    role: req.body.isAdmin ? 'admin' : 'member',
                    spotify_id: spotifyId.body.id,
                    access_token: access,
                    refresh_token: refresh,
                    token_refreshdate: tokenexpired,
                };
                // then create user in database, no await because of "then"
                let retUser = await UserModel.create(user);
                const token = jwt.sign(
                    {
                        _id: retUser._id,
                        username: retUser.username,
                        role: retUser.role,
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
            });
    } catch (err) {
        if (err.code == 11000) {
            return res.status(400).json({
                error: 'User exists',
                message: err.message,
            });
        } else {
            return res.status(500).json({
                error: 'Internal server error',
                message: err.message,
            });
        }
    }
};

const registerInvite = async (req, res) => {
    // check if the body of the request contains all necessary properties
    if (!Object.prototype.hasOwnProperty.call(req.body, 'username'))
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a username property',
        });
    if (!Object.prototype.hasOwnProperty.call(req.body, 'playlist_id'))
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a playlist_id property',
        });

    try {
        const playlist = await PlaylistModel.findById(req.body.playlist_id);

        const user = {
            username: req.body.username,
            playlist_id: playlist._id,
            host_id: playlist.owner,
        };
        await InvitedUser.create(user);
    } catch (err) {
        if (err.code == 11000) {
            return res.status(400).json({
                error: 'User exists',
                message: err.message,
            });
        } else {
            return res.status(500).json({
                error: 'Internal server error',
                message: err.message,
            });
        }
    }
};
const me = async (req, res) => {
    try {
        // get own user name from database
        let user = await UserModel.findById(req.userId)
            .select('username')
            .exec();

        if (!user)
            return res.status(404).json({
                error: 'Not Found',
                message: `User not found`,
            });

        return res.status(200).json(user);
    } catch (err) {
        return res.status(500).json({
            error: 'Internal Server Error',
            message: err.message,
        });
    }
};

const logout = (req, res) => {
    res.status(200).send({ token: null });
};

const deleteAccount = async (req, res) => {
    try {
        // get own user name from database
        await UserModel.findByIdAndRemove(req.params.id).exec();

        // return message that user was deleted
        return res
            .status(200)
            .json({ message: `User with id${req.params.id} was deleted` });
    } catch (err) {
        return res.status(500).json({
            error: 'Internal Server Error',
            message: err.message,
        });
    }
};

module.exports = {
    login,
    register,
    registerInvite,
    logout,
    me,
    deleteAccount,
};
