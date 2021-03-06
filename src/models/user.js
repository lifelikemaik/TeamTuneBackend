"use strict";

const mongoose = require("mongoose");

// Define the user schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    // role of the user, used for rights management
    role: {
        type: String,
        // role can only take the value "member" and "admin"
        enum: ["member", "admin"],
        // if not specified the role member is choosen
        default: "member",
    },
    playlists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist',
        required: false
    }],
    spotify_id: String,
    access_token: String,
    refresh_token: String,
    token_refreshdate: Date
});

UserSchema.set("versionKey", false);

// Export the User model
module.exports = mongoose.model("User", UserSchema);
