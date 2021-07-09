"use strict";

const jwt = require("jsonwebtoken");

const config = require("./config");

const UserModel = require("./models/user");
const PlaylistModel = require("./models/playlist");

const allowCrossDomain = (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "*");

    // intercept OPTIONS method
    if ("OPTIONS" == req.method) {
        res.sendStatus(200);
    } else {
        next();
    }
};

const checkAuthentication = (req, res, next) => {
    // check header or url parameters or post parameters for token
    let token = "";
    if (req.headers.authorization) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token)
        return res.status(401).send({
            error: "Unauthorized",
            message: "No token provided in the request",
        });

    // verifies secret and checks exp
    jwt.verify(token, config.JwtSecret, (err, decoded) => {
        if (err)
            return res.status(401).send({
                error: "Unauthorized",
                message: "Failed to authenticate token.",
            });

        // if everything is good, save to request for use in other routes
        req.userId = decoded._id;
        next();
    });
};

const getUserId = async (req, res, next) => {


    /*
    console.log(req.get('host'));
    console.log(req.query);
    console.log(req.id);
    console.log(req.params);
    console.log(req.params.id);

    console.log(req.headers);
    console.log(req.originalUrl);
    console.log(req.url);
    console.log(req.protocol + '://' + req.get('host') + req.originalUrl);

    let playlist = await PlaylistModel.find({"spotify_id": "60e5f03d5a3dec01402185c0"}, function(err, data){
        console.log(data);
    });
    */

    /**
     * if 60e5e9c071d37737e8167e51 also nur tumetune ID
     *
     */
    try{
        let playlist = await PlaylistModel.findOne({
            _id: new ObjectId("60e64c66583f232f84464381"),
        }).exec();

        console.log(playlist.owner);
    }catch (e) {
        console.log(e);
    }

    //let user = await UserModel.findById();

    // erstmal hardcode rein mit playlist
    // check header or url parameters or post parameters for userId



    // if everything is good, save to request for use in other routes
    //req.userId = decoded._id;
    next();

};

const checkIsAdmin = async (req, res, next) => {
    // checkAuthentication must be executed before this method
    // if not req.userId is not defined
    let user = await UserModel.findById(req.userId);

    if (user.role === "admin") {
        // if the user is an admin continue with the execution
        next();
    } else {
        // if the user is no admin return that the user has not the rights for this action
        return res.status(403).send({
            error: "Forbidden",
            message: "You have not the rights for this action.",
        });
    }
};

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    res.status(500);
    res.render("error", { error: err });
};

module.exports = {
    allowCrossDomain,
    checkAuthentication,
    checkIsAdmin,
    errorHandler,
    getUserId,
};
