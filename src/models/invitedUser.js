"use strict";

const mongoose = require("mongoose");

// Define the user schema
const InvitedUserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    host_id: mongoose.Schema.Types.ObjectId,
    playlist_id: mongoose.Schema.Types.ObjectId,
});

InvitedUserSchema.set("versionKey", false);

// Export the InvitedUser model
module.exports = mongoose.model("InvitedUser", InvitedUserSchema);
