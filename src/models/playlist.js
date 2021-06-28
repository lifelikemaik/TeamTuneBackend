"use strict";

const mongoose = require("mongoose");
const PlaylistMusic = require('./playlistmusic')


const PlaylistSchema = new mongoose.Schema({
    publicity: Boolean,
    spotify_id: String,
    title: {
        type: String,
        required: true
    },
    is_own_playlist: {
        type: Boolean,
        required: true
    },
    is_teamtune_playlist: Boolean,
    description: String,
    share_link: String,
    music_info: PlaylistMusic.schema,
    joined_people: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InvitedUser',
        required: false
    }]
})

PlaylistSchema.set("versionKey", false);

// Export the Movie model
module.exports = mongoose.model("Playlist", PlaylistSchema);
