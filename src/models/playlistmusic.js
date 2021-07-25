"use strict";

const mongoose = require("mongoose");

// Define the user schema
const PlaylistMusicSchema = new mongoose.Schema({
    duration_target: {
        type: Number,
        required: true
    },
    durations_ms: {
        type: Number,
        required: true
    },
    allow_explicit: Boolean,
    mode: Number,
    min_acousticness: Number,
    max_acousticness: Number,
    min_danceability: Number,
    max_danceability: Number,
    min_energy: Number,
    max_energy: Number,
    min_instrumentalness: Number,
    max_instrumentalness: Number,
    min_liveness: Number,
    max_liveness: Number,
    min_loudness: Number,
    max_loudness: Number,
    min_speechiness: Number,
    max_speechiness: Number,
    min_valence: Number,
    max_valence: Number,
    time_signature: Number,
}, {_id: false});

PlaylistMusicSchema.set("versionKey", false);

// Export the PlaylistMusic model
module.exports = mongoose.model("PlaylistMusic", PlaylistMusicSchema);
