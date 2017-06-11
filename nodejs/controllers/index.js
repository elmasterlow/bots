'use strict';

var express = require('express');
var router = express.Router();

router.get("/", function (req, res) {
    if (typeof req.session.passport !== 'undefined' && req.session.passport.user.access_token) {
        var access_token = req.session.passport.user.access_token;
    } else {
        var access_token = false;
    }

    res.render('index', {access_token: access_token});
});

module.exports = router;