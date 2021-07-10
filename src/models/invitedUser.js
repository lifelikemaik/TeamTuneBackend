"use strict";

const mongoose = require("mongoose");

// Define the user schema
const InvitedUserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    hostID: mongoose.Schema.Types.ObjectId,
    playlistID: mongoose.Schema.Types.ObjectId,
});

InvitedUserSchema.set("versionKey", false);

// Export the Movie model
module.exports = mongoose.model("InvitedUser", InvitedUserSchema);
