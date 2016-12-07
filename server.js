'use strict';

var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var pug = require('pug');
var bodyParser = require('body-parser');

var app = express();
if (process.env.MODE !== 'PROD')
    require('dotenv').load();

require('./app/config/passport')(passport);

mongoose.connect(process.env.MONGO_URI);
mongoose.Promise = global.Promise;

app.use('/controllers', express.static(process.cwd() + '/app/controllers'));
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/common', express.static(process.cwd() + '/app/common'));

app.use(session({
	secret: 'secret',
	resave: false,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'pug');
app.set('views', './app/views')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var routes = require('./app/routes/index.js');
routes(app, passport);

var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.dir(process.env.APP_URL);
	console.log('Node.js listening on port ' + port + '...');
});
