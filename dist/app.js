'use strict';

var path = require('path');
var api = require('./api');
var models = require('./models');
var generateTemplates = require('./models/generateTemplates');

var express = require('express');
var session = require('express-session');
var app = express(); // creates an instance of an express application
var nunjucks = require('nunjucks');
var routes = require('./routes');
var bodyParser = require('body-parser');
var history = require('connect-history-api-fallback');
var cors = require('cors');

var loadData = require('./data');

// app.get('/', (req, res) => res.send('New Alloy Strength'))

app.use(bodyParser.json()); // would be for AJAX requests
app.use(bodyParser.urlencoded({ extended: true })); // for HTML form submits

app.use(session({
    secret: 'ASSecret',
    resave: false,
    saveUninitialized: true,
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000
}));

app.use(function (req, res, next) {
    // console.log('session', req.session);
    next();
});

app.use(cors({
    origin: ['http://localhost:8080'],
    methods: ['GET', 'POST'],
    credentials: true // enable set cookie    
}));

// var thisUser = await User.findById(1).then(user => {
// 	console.log("USER FOUND!!! USER ID: " + user.id);
// 	console.log("User's stats: ");
// 	console.log(user.stats);
// 	thisUser = user;
// 	userFound = true;
// });
app.use('/api', api);

var createUser = require('./models/createUser');
app.use('/', routes);

app.use(express.static(path.join(__dirname, '..', 'views')));

app.set('view engine', 'html'); // have res.render work with html files

app.engine('html', nunjucks.render); // when giving html files to res.render, tell it to use nunjucks


nunjucks.configure('views', { noCache: true });

models.db.sync().then(function () {
    console.log('All tables created!');
    app.listen(process.env.PORT || 3000, function () {
        console.log('Server is listening on port 3000!');
    });
}).catch(console.error.bind(console));

// app.listen(3000, () => console.log('Alloy Strength on port ' + 3000))