"use strict";

const express    = require('express');
const bodyParser = require('body-parser');
const helmet     = require('helmet');

const middlewares = require('./middlewares');

const auth  = require('./routes/auth');
const movie = require('./routes/movie');
const playlist = require('./routes/playlist');


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
api.use('/movies', movie);
api.use('/playlists', playlist);


module.exports = api;