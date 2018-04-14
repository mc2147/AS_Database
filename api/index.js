const session = require('express-session');
var Promise = require("bluebird");
var bodyParser = require('body-parser');
var express = require('express');
const bcrypt    = require('bcryptjs');

var router = express.Router();
var models = require('../models');
	var Exercise = models.Exercise;
	var WorkoutTemplate = models.WorkoutTemplate;
	var SubWorkoutTemplate = models.SubWorkoutTemplate;
	var Workout = models.Workout;
	var User = models.User;

var data = require('../data');
    var W3a = data.AllWorkouts[3]["a"];
    var RPETable = data.RPETable;
    var Exercises = data.ExerciseDict;
    var VideosJSON = data.VideosJSON;
    var VideosVue = data.VideosVue;
    var DescriptionsJSON = data.DescriptionsJSON;

// var WorkoutGenerator = require('../data/WorkoutGenerator');
// console.log("API FILE 9");


var workoutTemplates = {};
workoutTemplates[1] = data.Workouts1;
workoutTemplates[2] = data.Workouts2;

const saltRounds = 10;

/**
 * Generates a salt for the user
 * Reference: https://en.wikipedia.org/wiki/Salt_(cryptography)
 * @return salt
 */

function generateSalt(){
    return bcrypt.genSaltSync(saltRounds);
}

function generateHash (password, salt){
    return bcrypt.hashSync(password, salt, null);
}

router.get("/session", function(req, res) {
    res.json(req.session);
})

router.get("/users", function(req, res) {
    // User.findById(11).then(user => user.destroy());
    // User.findById(12).then(user => user.destroy());
    // User.destroy({
    //     where:{}
    // });
    // User.findById(27).then(user => user.destroy());
    // User.findById(28).then(user => user.destroy());
    // User.findById(29).then(user => user.destroy());
    req.session.test = "TESTING";
    User.findAll({
        where: {}
    }).then((users) => {
        res.json(users);
    })
})

var loggedinUser = {};

router.post("/user/signup", function(req, res) {
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
            })
            res.json(user);
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

router.post("/user/login", function(req, res) {
    var username = req.body.username;
    var passwordInput = req.body.password;

    // User.findOne({
    //     where: {
    //         username,
    //     }
    // }).then((user) => {
    //     if (!user) {
    //         res.send("no user exists with that username");
    //     }
    //     else {
    //         var hashed = User.generateHash(passwordInput, user.salt);
    //         if (hashed == user.password) {
    //             res.send("Logged in!");
    //             // req.session.userId = user;
    //             // req.session.User = user;
    //         }
    //         else {
    //             res.send("Wrong password");
    //         }
    //     }
    // })
    // var input = req.body;
    // res.json(input);
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

router.use('/workout-templates', require('./workoutTemplates'));



router.get('/SubWorkoutTemplate', function(req, res) {
    console.log("req params: ", req.params);
    SubWorkoutTemplate.findAll({where:{}}).then(result => {
        res.json(result)
    })
});


router.get('/json/videos', function(req, res) {
    res.json(VideosJSON);
})

router.get('/json/videos/vue-api', function(req, res) {
    res.json(VideosVue(VideosJSON, 1));
})

router.get('/videos/vue-api', function(req, res) {
    console.log("VIDEOS");
})


router.post('/videos/post', function(req, res) {
    
})

router.get('/descriptions/json', function(req, res) {
    res.json(DescriptionsJSON);
})

router.get("/user/:userId", function(req, res) {
    var userId = req.params.userId;
    User.findById(userId).then((user) => {
        // user.oldstats.push({"test": "test"}),
        // user.oldstats.push(user.stats)
        user.save().then(() => {
            console.log("USER API 148");
            res.json(user);
        });
    })    
});

router.get("/user/:userId/workouts", function(req, res) {
    var userId = req.params.userId;
    User.findById(userId).then((user) => {
        res.json(user.workouts);
    })
    console.log("25");
});

router.get('/user/:userId/stats', function(req, res) {
    var userId = req.params.userId;
    User.findById(userId).then((user) => {
        // res.json(user.workouts);
        res.json(user.stats);
    })
    // console.log("25");
    console.log("USER STATS");
})

function vueStats(JSON) {
    output = [];
    for (var EType in JSON) {
        if (EType != "Level Up") {
            output.push(getVueStat(EType, JSON[EType]));
        }
    }
    return output;
}

router.get('/user/:userId/stats/vue/get', function(req, res) {
    var userId = req.params.userId;
    User.findById(userId).then((user) => {
        var JSONStats = user.stats;
        for (var statKey in JSONStats) {
            console.log(statKey);
        }
        console.log(JSONStats);
        // res.json(user.workouts);
        var vueData = {
            level: user.level,
            exerciseTableItems: vueStats(JSONStats),
        }
        res.json(vueData);
    })
    // console.log("25");
    console.log("USER STATS");
})

function getVueStat(EType, JSONStat) {
    var vueStat = {
        value:false,
    };
    vueStat.exerciseType = EType;
    vueStat.exerciseName = JSONStat.name;
    vueStat.max = JSONStat.Max;
    if (JSONStat.Status.value == 1) {
        vueStat.alloyResult = "PASSED";
    }
    else if (JSONStat.Status.value == -1) {
        vueStat.alloyResult = "FAILED";
    }
    else {
        vueStat.alloyResult = "---";
    }
    return vueStat;
}

function vueProgress(JSONStats) {
    var output = {
        coreExerciseTableItems: [],
        secondaryExerciseTableItems: [],
    };
    output.coreExerciseTableItems.push(getVueStat("UB Hor Push", JSONStats["UB Hor Push"]));
    output.coreExerciseTableItems.push(getVueStat("Squat", JSONStats["Squat"]));
    output.coreExerciseTableItems.push(getVueStat("Hinge", JSONStats["Hinge"]));
    
    for (var EType in JSONStats) {
        if (EType != "UB Hor Push" && EType != "Squat" && EType != "Hinge"
        && EType != "Level Up")
        output.secondaryExerciseTableItems.push(getVueStat(EType, JSONStats[EType]));        
    }
    return output;
}

router.get('/user/:userId/progress/vue/get', function(req, res) {
    var userId = req.params.userId;
    console.log("USER PROGRESS VUE");
    User.findById(userId).then((user) => {
        var JSONStats = user.stats;
        for (var statKey in JSONStats) {
            console.log(statKey);
        }
        // console.log(JSONStats);
        // res.json(user.workouts);
        var vueData = vueProgress(JSONStats);
        vueData.level = user.level;
        res.json(vueData);
    })
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

router.use('/users', require('./users'));


module.exports = router;