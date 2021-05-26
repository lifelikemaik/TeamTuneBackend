"use strict";

const mongoose = require("mongoose");

// Define the user schema
const SongSchema = new mongoose.Schema({
    interpret: String,
    album: String,
    acousticness: Number,
    danceability: Number,
    duration_ms: Number,
    energy: Number,
    instrumentalness: Number,
    key: Number,
    liveness: Number,
    loudness: Number,
    mode: Number,
    speechiness: Number,
    tempo: Number,
    time_signature: Number,
    valence: Number,
}, { _id: false });

UserSchema.set("versionKey", false);

// Export the Movie model
module.exports = mongoose.model("Song", SongSchema);
