const path = require('path');
var api = require('./api');
var models = require('./models');
    var generateTemplates = require('./models/generateTemplates');
    
    const express = require( 'express' );
    const session = require('express-session');
    const app = express(); // creates an instance of an express application
    var nunjucks = require('nunjucks');
    var routes = require('./routes');
    var bodyParser = require('body-parser');
    var history = require('connect-history-api-fallback');
    var cors = require('cors');
    
    var loadData = require('./data');
   
    process.env.BASE_URL = "https://obscure-citadel-34419.herokuapp.com/";
    console.log("base url test: ", process.env.BASE_URL);
    // app.get('/', (req, res) => res.send('New Alloy Strength'))
    
    app.use(bodyParser.json()); // would be for AJAX requests
    app.use(bodyParser.urlencoded({ extended: true })); // for HTML form submits
    
    app.use(session({
        secret: 'ASSecret',
        resave: false,
        saveUninitialized: true,    
        duration: 30 * 60 * 1000,
        activeDuration: 5 * 60 * 1000,
    }));
    
    

var allowCrossDomain = function(req, res, next) {
    // if ('OPTIONS' == req.method) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
        // res.send(200);
        next();
    // }
    // else {
    // }
};

app.use(allowCrossDomain);

app.use(function (req, res, next) {
    // console.log('session', req.session);
    next();
});

    
app.use(cors({
    origin:['http://alloystrength.s3-website-us-east-1.amazonaws.com'],
    methods:['GET','POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true // enable set cookie    
}));

// app.use(function)
    
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

app.use(express.static(path.join(__dirname, '..', 'views')))

app.set('view engine', 'html'); // have res.render work with html files

app.engine('html', nunjucks.render); // when giving html files to res.render, tell it to use nunjucks


nunjucks.configure('views', { noCache: true });


models.db.sync()
.then(function () {
    console.log('All tables created!');
    app.listen(process.env.PORT || 3000, function () {
        console.log('Server is listening on port 3000!');
    });
})
.catch(console.error.bind(console));

// app.listen(3000, () => console.log('Alloy Strength on port ' + 3000))