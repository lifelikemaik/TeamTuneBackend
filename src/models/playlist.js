"use strict";

const mongoose = require("mongoose");
const PlaylistMusic = require('./playlistmusic')


const PlaylistSchema = new mongoose.Schema({
    //err:  MongooseError [CastError]: Cast to ObjectId failed for value "spotify" at path "owner"
    owner: mongoose.Schema.Types.ObjectId,
    public_id: String,
    spotify_id: String,
    publicity: Boolean,
    title: {
        type: String,
        required: true
    },
    is_own_playlist: {
        type: Boolean,
        required: true
    },
    is_teamtune_playlist: Boolean,
    track_count: Number,
    description: String,
    image_url: String,
    music_info: PlaylistMusic.schema,
    joined_people: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InvitedUser',
        required: false
    }]
})

PlaylistSchema.set("versionKey", false);

// Export the Playlist model
module.exports = mongoose.model("Playlist", PlaylistSchema);
