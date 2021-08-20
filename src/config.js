"use strict";

// Configuration variables
const port = process.env.PORT || "4000";
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/teamtunedb";
const JwtSecret = process.env.JWT_SECRET || "very secret secret";

// Configure necessary Spotify API links
const authorize_uri = "https://accounts.spotify.com/authorize"
const token_uri = "https://accounts.spotify.com/api/token";
const playlists_uri  = "https://api.spotify.com/v1/me/playlists";
const tracks_uri = "https://api.spotify.com/v1/playlists/{{PlaylistId}}/tracks";

// Configure Spotify API app credentials
const client_id = '13fc26a1aa724752953370044913e510'; // Your client id
const client_secret = 'ba4d3f52435c4928952e15184711f7b7'; // Your secret
const redirect_uri = "https://teamtune.fun/callback"

// Exporting all variables
module.exports = {
    port,
    mongoURI,
    JwtSecret,
    authorize_uri,
    token_uri,
    playlists_uri,
    tracks_uri,
    client_id,
    client_secret,
    redirect_uri
};
