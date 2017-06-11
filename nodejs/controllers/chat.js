'use strict';

var express = require('express');
var router = express.Router();
var config = require('../config');
var MessageHandler = require('../utils/message-handler');
var irc = require('irc');

var messageHandler = new MessageHandler(config);

console.error = console.log;
console.log = function (log) {
    if (arguments.length === 3 && arguments[2].substr(0, 4) === 'SEND') {
        messageHandler.storeMessage(arguments[2]);
    } else {
        console.error(log);
    }
};

router.use('/', function (req, res, next) {
    if (typeof req.session.passport === 'undefined') {
        return res.redirect('/');
    }
    next()
})

router.get('/', function (req, res) {
    // bot instance
    var bot = new irc.Client(config.twitch.host, config.twitch.nick, {
        channels: [config.twitch.channels + " " + config.twitch.password],
        debug: true,
        password: "oauth:" + req.session.passport.user.access_token,
        username: config.twitch.nick,
        millisecondsOfSilenceBeforePingSent: 240 * 1000,
        millisecondsBeforePingTimeout: 180 * 1000,
    });

    // clear messages
    setInterval(function () {
        messageHandler.clearMessages();
    }, 1000);

    // send awaiting messages
    setInterval(function () {
        messageHandler.sendAwaitingMessages(function (message) {
            bot.say(config.twitch.channels[0], message.text);
        });
    }, 1000);

    // bot.addListener("raw", function (raw) {});

    // ask for membership
    bot.addListener("motd", function (motd) {
        bot.send('CAP REQ', 'twitch.tv/membership');
    });

    bot.addListener("join", function (channel, nickname) {
        console.log(nickname + ' just joined');
        // user just joined to room, remember his name
        messageHandler.rememberNickname(nickname, messageHandler.randomMessage.bind(messageHandler));
    });

    bot.addListener("ping", function () {
        // console.log('Send pong to server!');

        bot.send('PONG', 'tmi.twitch.tv');
    });

    bot.addListener("error", function (error) {
        // console.log(error);
    });

    res.render('chat');
});

module.exports = router;