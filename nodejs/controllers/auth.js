'use strict';

var express = require('express');
var router = express.Router();
var passport = require("passport");
var twitchStrategy = require("passport-twitch").Strategy
var config = require('../config');

passport.use(new twitchStrategy({
        clientID: config.twitch.clientID,
        clientSecret: config.twitch.clientSecret,
        callbackURL: config.twitch.callbackURL,
        scope: config.twitch.scope,
    },
    function(accessToken, refreshToken, profile, done) {
        profile.access_token = accessToken;
        return done(null, profile);
    }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

router.get("/twitch", passport.authenticate("twitch"));
router.get("/twitch/callback", passport.authenticate("twitch", { failureRedirect: "/" }), function(req, res) {
    res.redirect("/");
});

module.exports = router;