// vendors
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require("passport");
var session = require('express-session');

// app
var chat = require('./controllers/chat');
var index = require('./controllers/index');
var auth = require('./controllers/auth');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'ohXybRRcPA',
    cookie: {}
}));

app.use(passport.initialize());

app.use('/', index);
app.use('/auth', auth);
app.use('/chat', chat);

module.exports = app;
