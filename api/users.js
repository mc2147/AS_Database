// const session = require('express-session');
import session from 'express-session';
import Promise from "bluebird";
var bodyParser = require('body-parser');
var express = require('express');
const bcrypt    = require('bcryptjs');
import {assignWorkouts, signupUser} from './apiFunctions';

var router = express.Router();
var models = require('../models');
	var Exercise = models.Exercise;
	var WorkoutTemplate = models.WorkoutTemplate;
	var SubWorkoutTemplate = models.SubWorkoutTemplate;
	var Workout = models.Workout;
	var User = models.User;

// let data = require('../data');
import data from '../data';
    var W3a = data.AllWorkouts[3]["a"];
    var RPETable = data.RPETable;
    var Exercises = data.ExerciseDict;
    var VideosJSON = data.VideosJSON;
    var VideosVue = data.VideosVue;
    var DescriptionsJSON = data.DescriptionsJSON;
    var allWorkoutJSONs = data.AllWorkouts;
    
var globalFuncs = require('../globals/functions');
	var getMax = globalFuncs.getMax;
	var getWeight = globalFuncs.getWeight;
	var getWorkoutDates = globalFuncs.getWorkoutDays;
    var G_getPattern = globalFuncs.getPattern;
    var dateString = globalFuncs.dateString;
    
var globalEnums = require('../globals/enums');
    var DaysofWeekDict = globalEnums.DaysofWeekDict;
    var Alloy = globalEnums.Alloy;
var workoutHandlers = require('../routes/workoutHandlers');
	var saveWorkout = workoutHandlers.saveWorkout;

var vueAPI = require('../routes/vueAPI');
    var getVueInfo = vueAPI.getVueInfo;

router.get("/", function (req, res) {
    User.findAll({
        where: {}
    }).then((users) => {
        res.json(users);
    })
});

router.post("/", async function(req, res) {
    var newUser = await signupUser(req.body);
    if (!newUser) {
        res.json({
            error:true,
            status: "passwords no match",
        })
    }
    res.json(newUser);
})

router.post("/:username/login", async function (req, res) {
    var username = req.params.username;
    var passwordInput = req.body.password;
    console.log("username/login route hit", req.body);
    var loginUser = await User.findOne({
        where: {
            username,
        }
    });

    if (!loginUser) {
        res.json({
            Success: false,
            Found: false,
            Status: "No user found"
        });
    }
    else {
        var hashed = User.generateHash(passwordInput, loginUser.salt);
        if (hashed == loginUser.password) {
            res.json({
                Success: true,
                Found: true,
                Status: "Success",
                User:loginUser,
            });
        }
        else {
            res.json({
                Success: false,
                Found: true,
                Status: "Incorrect Password!"
            });
        }
    }
})

router.get("/:userId", function(req, res) {
    User.findById(req.params.userId).then((user) => {
        res.json(user);
    });
});

router.get("/:userId/workouts", function(req, res) {
    User.findById(req.params.userId).then((user) => {
        res.json(user.workouts);
    });
})

router.get("/:userId/workouts/:workoutId", function(req, res) {
    User.findById(req.params.userId).then((user) => {
        var _Workout = user.workouts[req.params.workoutId];
        // _Workout
        res.json(_Workout);
    });
})

router.put("/:userId/workouts/:workoutId/save", async function(req, res) {
     console.log("108 save workout by Id");
    var _User = await User.findById(req.params.userId);
    var body = req.body;    
    await saveWorkout(body.submission, _User, req.params.workoutId);
    res.json(req.body);
})

router.post("/:userId/workouts/:workoutId/save", async function(req, res) {
   console.log("128 save workout by Id!!!!");
   var _User = await User.findById(req.params.userId);
//    console.log("found User?: ", _User);
   var body = req.body;    
   await saveWorkout(body, _User, req.params.workoutId);
   res.json(req.body);
})


router.put("/:userId/workouts/:workoutId/submit", async function(req, res) {
    // console.log("108 save workout by Id");
   var _User = await User.findById(req.params.userId);
   var workoutId = req.params.workoutId;
   var body = req.body;    
   await saveWorkout(body, _User, req.params.workoutId);
    if (parseInt(workoutId) == _User.workoutDates.length) {
        console.log("LEVEL CHECK! ", workoutId);
        var levelUpStats = _User.stats["Level Up"];
        if (!levelUpStats.Status.Checked && levelUpStats.Status.value == 1) {
            _User.level ++;
            // _User.stats["Level Up"].Status = Alloy.Passed;
        }
        _User.stats["Level Up"].Status.Checked = true;
        _User.changed( 'stats', true);
        await _User.save();
        body.lastWorkout = true;
    }
    res.json(body);
})

router.get("/:userId/workouts/:workoutId/vue", function(req, res) {
    User.findById(req.params.userId).then((user) => {
        var _Workout = user.workouts[req.params.workoutId];
        var _WorkoutDate = user.workoutDates[req.params.workoutId - 1];
        let JSON = _Workout;
        JSON.thisWorkoutDate = _WorkoutDate;
        var vueJSON = getVueInfo(JSON);

		
		let workoutDatelist = [];
		var userWorkouts = user.workouts;
		for (var K in userWorkouts) {
			var Workout = userWorkouts[K];
			if (!Workout.ID) {
				continue;
			}
			var _W = Workout.Week;
			var _D = Workout.Day;
			var wID = Workout.ID;
			// var date = G_UserInfo["User"].workoutDates[wID - 1];
			var date = dateString(user.workoutDates[wID - 1]);
			// console.log("date", date, _W, _D, K);
			workoutDatelist.push({Week: _W, Day: _D, Date: date, ID: wID});		
		}
        
        vueJSON.workoutDates = workoutDatelist;

        res.json(vueJSON);
    });
})


router.put("/:userId", function(req, res) {
    User.findById(req.params.userId).then((user) => {
        user.update(req.body).then(user => res.json(user));
    });
})

router.get("/:userId/stats", function(req, res) {
    User.findById(req.params.userId).then((user) => {
        res.json(user.stats);
    })
})

router.put("/:userId/stats", function(req, res) {
    User.findById(req.params.userId).then((user) => {
        user.update(
            {
                stats:req.body,
            }            
        ).then(user => res.json(user));
    });
})

router.put("/:userId/workouts", function(req, res) {
    User.findById(req.params.userId).then((user) => {
        user.update(
            {
                workouts:req.body,
            }            
        ).then(user => res.json(user));
    });
})

router.post("/:userId/oldstats", function(req, res) {
    User.findById(req.params.userId).then((user) => {
        user.oldstats.push(req.body);
        user.changed('oldstats', true);
        user.save().then(user => res.json(user));
    });
})

router.put("/:userId/save-workout", async function(req, res) {
    console.log("save-workout put: ", req.body);
    var updateUser = await User.findById(req.params.userId);
    var body = req.body;    
    await saveWorkout(body.submission, updateUser, body.viewingWID);
    res.json(req.body);
})

router.put("/:userId/submit-workout", async function(req, res) {
    console.log("submit-workout put: ", req.body);
    var updateUser = await User.findById(req.params.userId);
    var body = req.body;    
    await saveWorkout(body.submission, updateUser, body.viewingWID, true);
    if (parseInt(body.viewingWID) == updateUser.workoutDates.length) {
        console.log("LEVEL CHECK! ", body.viewingWID);
        var levelUpStats = updateUser.stats["Level Up"];
        if (!levelUpStats.Status.Checked && levelUpStats.Status.value == 1) {
            updateUser.level ++;
            // updateUser.stats["Level Up"].Status = Alloy.Passed;
        }
        updateUser.stats["Level Up"].Status.Checked = true;
        updateUser.changed( 'stats', true);
        await updateUser.save();
        body.lastWorkout = true;
    }
    res.json(body);
})

router.put("/:userId/generate-workouts", async function(req, res) {
    var input = req.body;
    var _User = await User.findById(req.params.userId);
    if (_User.workoutDates.length > 0) {
        var _oldStat = {
            finishDate : _User.workoutDates[-1],
            level : _User.level,
        };
        _oldStat.statDict = _User.stats
        _User.oldstats.push(_oldStat);
        _User.changed( 'oldstats', true);
        await _User.save();
    }
    assignWorkouts(_User, input);
    await _User.save();
    res.json({input, updatedUser: _User, session: {
        viewingWID: 1,
        User: _User,
        username: _User.username,
        userId: _User.id,
    }});
    return    
});

// router.post("/:userId/old-stats/clear", async function(req, res) {

// })

router.post("/:userId/get-next-workouts", async function(req, res) {
    var input = req.body;
    console.log("91", input);
    var _User = await User.findById(req.params.userId);
    _User.oldstats = [];
    _User.oldworkouts = [];
    await _User.save();
    if (_User.workoutDates.length > 0) {
        var lastWDate = _User.workoutDates[_User.workoutDates.length - 1];
        console.log("last workout date in list: ", _User.workoutDates[_User.workoutDates.length - 1]);
        var _oldStat = {
            finishDate : lastWDate,
            level : _User.level,
        };
        var _oldWorkouts = _User.workouts;
        _oldStat.statDict = _User.stats
        _User.oldstats.push(_oldStat);
        _User.oldworkouts.push(_oldWorkouts);
        _User.changed( 'oldstats', true);
        _User.changed( 'oldworkouts', true);
        await _User.save(); 
    }
    await assignWorkouts(_User, input);
    await _User.save();
    res.json({input, updatedUser: _User, session: {
        viewingWID: 1,
        User: _User,
        username: _User.username,
        userId: _User.id,
    }});
    return
}) 

router.get("/:userId/videos", async function(req, res) {
    var videosUser = await User.findById(req.params.userId);
    var videos = VideosVue(VideosJSON, videosUser.level);
    res.json(videos);
})



module.exports = router;