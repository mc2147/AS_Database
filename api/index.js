const session = require('express-session');
const axios = require('axios');
var Promise = require("bluebird");
var bodyParser = require('body-parser');
var express = require('express');
const bcrypt = require('bcryptjs');

var router = express.Router();
import {Exercise, WorkoutTemplate, SubWorkoutTemplate, Workout, User, Video} from '../models';
import {signupUser, assignWorkouts} from './apiFunctions';
import {vueStats, getVueStat, vueProgress} from './vueFormat';
var data = require('../data');
    var W3a = data.AllWorkouts[3]["a"];
    var RPETable = data.RPETable;
    var Exercises = data.ExerciseDict;
    var VideosJSON = data.VideosJSON;
    var VideosVue = data.VideosVue;
    var DescriptionsJSON = data.DescriptionsJSON;

// var WorkoutGenerator = require('../data/WorkoutGenerator');
// console.log("API FILE 9");
// var baseURL = process.env.PORT ? 

var workoutTemplates = {};
workoutTemplates[1] = data.Workouts1;
workoutTemplates[2] = data.Workouts2;

const saltRounds = 10;

/**
 * Generates a salt for the user
 * Reference: https://en.wikipedia.org/wiki/Salt_(cryptography)
 * @return salt
 */

router.use('/content', require('./content'));

router.use('/workout-templates', require('./workoutTemplates'));

router.use('/users', require('./users'));

function generateSalt(){
    return bcrypt.genSaltSync(saltRounds);
}

function generateHash (password, salt){
    return bcrypt.hashSync(password, salt, null);
}

router.get("/session", function(req, res) {
    res.json(req.session);
})


var loggedinUser = {};

router.post("/test-route", function (req, res) {
    console.log("test-route hit: ", req.body);
    res.json(req.body);
})

router.post("/user/login", async function(req, res) {
    console.log("LOGIN POST");
    var username = req.body.username;
    var passwordInput = req.body.password;
    var axiosPost = await axios.post(`/api/users/${username}/login`, req.body,
    { proxy: { host: '127.0.0.1', port: 3000 } });
    
    res.json(axiosPost.data);
    // res.send("test");

    return

})

router.post("/user/signup", async function(req, res) {
        var axiosPost = await axios.post("/api/users/", req.body,
        { proxy: { host: '127.0.0.1', port: 3000 } });
        res.json(axiosPost.data);
        return
        
        var input = req.body;
        var P1 = req.body.P1;
        var P2 = req.body.P2;
        var id = parseInt(req.body.id);
        var salt = generateSalt();
        console.log("creating user with post:", req.body);
        req.session.test = "TESTING post";
        req.session.save();
        console.log(req.session);
        if (P1 == P2) {
            var hashedPassword = generateHash(req.body.P1, salt);
            input.hashed = hashedPassword;
            User.create({
                id: 29,
                username: req.body.username,
                salt: salt,
                password: hashedPassword,
            }).then((user) => {
                // console.log
                req.session.userId = user.id;
                req.session.username = user.username;
                req.session.User = user;
                loggedinUser = user;

                res.json({
                    user,
                    session: {
                        userId: user.id,
                        username: user.username,
                        User: user,        
                    }
                });
            }).catch((err) => {
                res.json({
                    error: true,
                    status: "error"
                })
            })
        }
        else {
            res.send("Passwords not matching");
        }
		// res.json(input);
	}
)

router.get("/user/logged-in", function(req, res) {
    if (loggedinUser) {
        req.session.User = loggedinUser;
        req.session.userId = loggedinUser.id;
        req.session.username = loggedinUser.username;        
    }
    res.json(loggedinUser);
})

// router.get("/templates/3a", function(req, res) {
//     console.log("25");
//     res.json(W3a);
// });
router.get("/exercises", function(req, res) {
    Exercise.findAll({
        where:{},
    }).then(exercises => {
        res.json(exercises);
    })
});

// console.log("W3a", W3a);
router.get("/templates/3a", function(req, res) {
    console.log("25");
    res.json(W3a);
});

router.get("/templates/3b", function(req, res) {
    res.json(data.AllWorkouts[3]["b"]);
});

router.get("/templates/4a", function(req, res) {
    res.json(data.AllWorkouts[4]["a"]);
});

router.get("/templates/4b", function(req, res) {
    res.json(data.AllWorkouts[4]["b"]);
});

router.get('/SubWorkoutTemplate', function(req, res) {
    console.log("req params: ", req.params);
    SubWorkoutTemplate.findAll({where:{}}).then(result => {
        res.json(result)
    })
});


router.get('/json/videos', function(req, res) {
    res.json(VideosJSON);
})

router.get('/videos', function(req, res) {
    Video.findAll({
        where: {}
    }).then(videos => {
        res.json(videos);
    })
    // res.json()
})

router.get('/json/videos/vue-api', function(req, res) {
    res.json(VideosVue(VideosJSON, 25));
})

router.get('/videos/vue-api', function(req, res) {
    console.log("VIDEOS");
})


router.post('/videos/post', function(req, res) {
    
})

router.get('/descriptions/json', function(req, res) {
    res.json(DescriptionsJSON);
})

router.get('/json/exercises', function(req, res) {
    res.json(Exercises);
    // console.log("req params: ", req.params);
});

router.get('/json/rpe-table', function(req, res) {
    res.json(RPETable);
    // console.log("req params: ", req.params);
});

router.use('/json', require('./JSONs'));

module.exports = router;