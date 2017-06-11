'use strict';

var fs = require('fs');
var moment = require('moment');
var Array = require('../utils/array');

var MessageHandler = function (config) {
    this.config = config;
    this.messages = [];
    this.awaitingMessages = [];
};

MessageHandler.prototype.readFile = function () {
    try {
        return fs.readFileSync(this.config.file.path).toString();
    } catch (err) {
        switch (err.errno) {
            case -2:
                // create blank file if does not exists
                fs.writeFileSync(this.config.file.path, '');
                return '';
                break;
            default:
                throw (err);
                break;
        }
    }
};

MessageHandler.prototype.storeNickname = function (nickname) {
    fs.appendFile(this.config.file.path, nickname + this.config.file.separator, function(err) {
        if(err) {
            throw (err);
        }
    });
};

MessageHandler.prototype.sendAwaitingMessages = function (callback) {
    if (this.messages.length < this.config.twitch.messagesLimit && this.awaitingMessages.length) {
        // get first awaiting message
        callback(this.awaitingMessages.shift());
    }
};

MessageHandler.prototype.rememberNickname = function (nickname, callback) {
    var self = this;

    this.readFile().split(this.config.file.separator).contains(nickname, function (nicknameExists) {
        if (!nicknameExists) {
            self.storeNickname(nickname);
            callback(nickname, self.batchMessages.bind(self));
        }
    });
};

MessageHandler.prototype.randomMessage = function (nickname, callback) {
    fs.readFile(this.config.file.welcome, function (err, data) {
        var lines = data.toString().split('\n');
        // get random line
        var message = lines[Math.floor(Math.random() * lines.length)];
        message = message.replace('%who%', '@' +nickname);

        callback(message, nickname);
    });
};

MessageHandler.prototype.batchMessages = function (message, nickname) {
    this.awaitingMessages.push({'text': message, 'to': nickname});
};

// store messages that been already sent
MessageHandler.prototype.storeMessage = function (message) {
    this.messages.push({'time': moment(), 'message': message});
};

// clear all messages which are older than 30 seconds
MessageHandler.prototype.clearMessages = function () {
    if (this.messages.length) {
        for (var i in this.messages) {
            var message = this.messages[i];
            if (message.time < moment().subtract(30, 'seconds')) {
                console.log('Deleting ' + i + ' message');
                delete this.messages[i];
            }
        }
    }
};

module.exports = MessageHandler;