"use strict";

const express    = require('express');
const bodyParser = require('body-parser');
const helmet     = require('helmet');

const middlewares = require('./middlewares');

const auth  = require('./routes/auth');
const playlist = require('./routes/playlist');
const callback = require('./routes/callback');

const api = express();

// Adding Basic Middlewares
api.use(helmet());
api.use(bodyParser.json());
api.use(bodyParser.urlencoded({ extended: false }));
api.use(middlewares.allowCrossDomain);


// Basic route
api.get('/', (req, res) => {
    res.json({
        name: 'TeamTune Backend'
    });
});


// API routes
api.use('/auth'  , auth);
api.use('/playlists', playlist);
api.use('/callback', callback);


module.exports = api;