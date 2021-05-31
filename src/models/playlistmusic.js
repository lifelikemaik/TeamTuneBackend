"use strict";

const mongoose = require("mongoose");
const Song = require('./song')

// Define the user schema
const PlaylistMusicSchema = new mongoose.Schema({
    durations_ms: {
        type: Number,
        required: true
    },
    songs: [Song.schema],
    number_songs: {
        type: Number,
        required: true
    },
    mode: Number,
    acousticness_min: Number,
    acousticness_max: Number,
    danceability_min: Number,
    danceability_max: Number,
    energy_min: Number,
    energy_max: Number,
    instrumentalness_min: Number,
    instrumentalness_max: Number,
    key_min: Number,
    key_max: Number,
    liveness_Min: Number,
    liveness_Max: Number,
    loudness_min: Number,
    loudness_max: Number,
    speechiness_min: Number,
    speechiness_max: Number,
    tempo_min: Number,
    tempo_max: Number,
    time_signature: Number,
    valence_min: Number,
    valence_max: Number,
}, { _id: false });

PlaylistMusicSchema.set("versionKey", false);

// Export the Movie model
module.exports = mongoose.model("PlaylistMusic", PlaylistMusicSchema);
