import session from 'express-session';
// const session = require('express-session');
var Promise = require("bluebird");
var bodyParser = require('body-parser');
var express = require('express');
var router = express.Router();

const axios = require('axios');
// import axios from 'axios';

var models = require('../models');
	var Exercise = models.Exercise;
	var WorkoutTemplate = models.WorkoutTemplate;
	var SubWorkoutTemplate = models.SubWorkoutTemplate;
	var Workout = models.Workout;
	var User = models.User;
// import * from '../models';

var userFuncs = require('../models/createUser');
	var setUser = userFuncs.SetUser;

var data = require('../data');
	var G1KeyCodes = data.Workouts1.getWeekDay;
	var Group1WDtoID = data.Workouts1.getID;
	var ExerciseDict = data.ExerciseDict.Exercises;
	var RPE_Dict = data.RPETable;
	var allWorkoutJSONs = data.AllWorkouts;
	// var Group1Workouts = require('../WorkoutGroup1');

var globalEnums = require('../globals/enums');
	var Alloy = globalEnums.Alloy;
	
var globalFuncs = require('../globals/functions');
	var getMax = globalFuncs.getMax;
	var getWeight = globalFuncs.getWeight;
	var getWorkoutDates = globalFuncs.getWorkoutDays;
	var G_getPattern = globalFuncs.getPattern;

var vueAPI = require('./vueAPI');
	var getVueInfo = vueAPI.getVueInfo;
	var vueConvert = vueAPI.vueConvert;

var workoutHandlers = require('./workoutHandlers');
	var saveWorkout = workoutHandlers.saveWorkout;

var Videos = require('../data/JSON/Videos');
	var getVideos = Videos.getVideos;
	var videosJSON = Videos.VideosJSON;
	
var UserLevel = 1

var postURL = "postWorkout";
var getURL = "getWorkout";

let baseUrl = process.env.baseURL || "http://localhost:3000";

// console.log("process.env: ", process.env);
// console.log("BASE URL:::", process.env.baseURL);

var levelGroupsDict = {
	// Add Week and Day list here too
	1: [1, 2, 3, 4, 5],
	2: [6, 7, 8, 9, 10],
	3: [11, 12, 13, 14, 15],
	4: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
}

// -Put everything together for entire flow
// 	user initial creation + workout generation 
// 		-> going through workouts + updating stats 
// 			-> level-check 
// 				-> stashing old workouts/stats + generate next set of workouts -> repeat

// var Alloy = {
// 	None: {value: 0, name: "None", code: "N", string: "None"},
// 	Testing: {value: 2, name: "Test", code: "T", string: "Testing"},
// 	Passed: {value: 1, name: "Passed", code: "P", string: "Passed"},
// 	Failed: {value: -1, name: "Failed", code: "F", string: "Failed"},
// }

// Ref Dict
// Default Ref Dict
var selectedWeek = 1;
var selectedDay = 1;
var WeekList = [1, 2, 3, 4];
var DayList = [1, 2, 3];

console.log("TEST: "); 

// var viewingWorkoutID = 1;

function displayDict(user, viewingWID) {
	
}

function userRefDict(user, viewingWID) {
	var output = {};
	output["User"] = user;
	output["Stats"] = user.stats;
	
	output["Workouts"] = user.workouts;

	var thisWorkoutID = viewingWID;

	output["thisWorkoutID"] = viewingWID;
	output["Level"] = user.level;

	selectedWeek = user.workouts[viewingWID].Week;
	selectedDay = user.workouts[viewingWID].Day;	

	output["thisWorkoutDate"] = user.workoutDates[user.viewingWID - 1];
	output["thisPatterns"] = user.workouts[thisWorkoutID].Patterns;

	output["levelGroup"] = user.levelGroup;
	output["blockNum"] = user.blockNum;
	output["thisLevels"] = levelGroupsDict[user.levelGroup];

	return output
}

function dateString(date) {
	var MonthDict = {
		1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June",
		7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December",
	}
	var output = "";
	var year = date.getFullYear();
	var day = date.getDate();
	var month = date.getMonth() + 1;
	// var suffix = ""
	output = MonthDict[month] + " " + day + ", " + year;
	return output
}

var userFound = false; 
var thisUser; 
var thisPatterns;
var G_thisStats;
var G_UserInfo;

//Use this to assign to req.session later
function loadUserInfo(id) {
	return User.findById(id).then(user => {
		// if (user.workouts.loaded) {		
			G_UserInfo = userRefDict(user, user.currentWorkoutID);
			thisUser = G_UserInfo["User"];
			G_thisStats = G_UserInfo["Stats"];
			thisPatterns = G_UserInfo["thisPatterns"];
			// console.log("Creating User Ref Dict: ");
			userFound = true;
		// }
	});
}

// loadUserInfo(1);

router.get('/show-videos', function (req, res) {
	res.json(getVideos(VideosJSON, thisUser.level));
});

router.get('/' + getURL, function(req, res) {

	console.log("G_vueOutput", G_vueOutput);
	res.json(G_vueOutput);
})

// router.get('/test-route', 
// 	async(req, res, next) => {	
// 		req.session.userId = 1;
// 		req.session.User = await User.findById(req.session.userId);
// 		req.session.User.workouts = {"test": "test"};
// 		await req.session.User.save();		
// 		var realUser = 	await User.findById(req.session.userId);
// 		console.log("==: ", 
// 		realUser === req.session.User);
// 		res.json({"test": "test"});
// 	})

//ADD to req.session
	//User.WorkoutDates
	//currentWorkoutID
	//viewingWID
	//workouts
	//current workout patterns 
//^^HIGH LEVEL REQUIREMENTS
	//req.session.viewingWorkout
	//req.session.User

var thisUserID = 5;

var thisUserName = "UserName5";

var allLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
var daysOfWeek = [
	[1, "Monday"], 
	[2, "Tuesday"], 
	[3, "Wednesday"], 
	[4, "Thursday"], 
	[5, "Friday"], 
	[6, "Saturday"],
	[0, "Sunday"], 
];

var DaysofWeekDict = {
	0: "Sunday",
	1: "Monday",
	2: "Tuesday",
	3: "Wednesday",
	4: "Thursday",
	5: "Friday",
	6: "Saturday",
}

router.get('/signup',
	async function(req, res, next) {
		res.render("signup");
	}
)
router.get('/login',
	async function(req, res, next) {
		res.render("login");
	}
)

router.post('/signup',
	async function(req, res, next) {
		res.render(req.body);
	}
)
router.post('/login',
	async function(req, res, next) {
		res.json(req.body);
	// 	res.render("createWorkouts", {allLevels, daysOfWeek});
	}
)



router.get('/get-next-workouts',
	async function(req, res, next) {
		var _User = await User.findById(req.session.userId);	
		// res.json(_User);
		var dateNow = new Date(Date.now());
		var month = dateNow.getMonth() + 1;
		if (month < 10) {
			month = "0" + month;
		}
		var date = dateNow.getDate();
		if (date < 10) {
			date = "0" + date;
		}
		var currDate = dateNow.getFullYear() + "-" + month + "-" + date;
		console.log("currDate: ", currDate);
		console.log("req.session", req.session);
		res.render("createWorkouts", {allLevels, daysOfWeek, User: _User, currDate});
	}
)
// var test = axios.get('/api/users'
//     ,{ proxy: { host: '127.0.0.1', port: 3000 }}
// );

router.post('/get-next-workouts',
	async function(req, res, next) {
		if (!req.session.userId) {
			req.session.userId = 8;
		}
		// 
		console.log("req.session", req.session);
		var axiosPost = await axios.post(`/api/users/${req.session.userId}/get-next-workouts`, req.body,
		{ proxy: { host: '127.0.0.1', port: 3000 } });
		res.json(axiosPost.data);
		return		
	}
)

var G_vueOutput = {};

var herokuURL = "https://obscure-citadel-34419.herokuapp.com/";

router.get('/', 
	async(req, res, next) => {	
	// req.session.userId -> find user -> get information as req.session.user
	// req.session.userId = 1;
	// req.session.userId = thisUserID;
	console.log("req.session: ", req.session);
	if (!req.session.username) {
		req.session.username = thisUserName;
		console.log("line 284 getting hit: ", thisUserName);
		User.findAll({
			where:{}
		}).then(users => {
			// console.log("ALL USERS: ", users);
		})
	}
	req.session.User = await User.findOne({where: {username: req.session.username}});
	req.session.userId = req.session.User.id;
	console.log("LINE 295 (BEFORE AXIOS)");

	// axios({
	// 	method:'get',
	// 	url: herokuURL + "/api/users",
	// })
	var thisUserURL = herokuURL + "api/users/" + req.session.userId;
	console.log("thisUserURL", thisUserURL);
	axios.get(thisUserURL)
	.then(res => res.data)
	.then(user => {
			console.log("FINDING CURRENT USER: ", user);
		} 
	);
	var loginTestURL = herokuURL + "api/users/" + req.session.username + "/login";
	axios.post(loginTestURL, {
		username: req.session.username,
		password: "Password5",
	}).then(res => res.data)
	.then(status => {
		console.log("LOGIN POST WORKS!!!", status);
	})
	

	// axios.get("/api/users/" + req.session.userId)
	// .then(res => res.data)
	// .then(user => {
	// 		console.log("FINDING CURRENT USER: ", user);
	// 	} 
	// );

	console.log("LINE 304 (AFTER AXIOS)");
// console.log("390", req.session)c
		// (req.session.userId);
	// req.session.User = await User.findById(req.session.userId);
	// thisUser = req.session.User;

	if (!req.session.viewingWID) {
		req.session.viewingWID = req.session.User.currentWorkoutID;
	}

	req.session.viewingWorkout = req.session.User.workouts[req.session.viewingWID];
	// console.log("index.js 189 thisPatterns", req.session.User.workouts[req.session.viewingWID]);
	// console.log("router.get stats", req.session.User.stats);
	console.log("router.get patterns \n");
    req.session.viewingWorkout.Patterns.forEach((elem) => {
        // console.log("alloy Status: ", elem.alloystatus);
    })
	
	// G_UserInfo = userRefDict(thisUser, req.session.viewingWID);
	// G_UserInfo["thisWorkoutID"] = req.session.viewingWID;
	// console.log("req.session 204", req.session);
	//On Reset: req.session.userInfo = {};
	if (!req.session.User) {
		render();
		return
	}
	console.log("LINE 335");
	
	var TemplateID = req.session.viewingWID;
	var wDateIndex = req.session.viewingWID - 1;
	req.session.viewingWorkoutDate = req.session.User.workoutDates[wDateIndex];

	var _Level = req.session.User.level;

	// G_UserInfo["thisWorkoutDate"] = req.session.User.workoutDates[wDateIndex];
	

	var thisworkoutDate = req.session.User.workouts[TemplateID].Date;
	// var test = await axios.get('/api/users'
	// 	,{ proxy: { host: '127.0.0.1', port: 3000 }}
	// );
	// console.log("432 test");

	//Change to req.session later
	if (
		// req.session.User.workouts[TemplateID].Patterns.length != 0
		req.session.User.workouts[req.session.viewingWID].Patterns.length != 0
		// ||  G_UserInfo["thisPatterns"].length != 0
	) {
		console.log("LINE 219");
		// G_UserInfo["thisPatterns"] = req.session.User.workouts[TemplateID].Patterns;
		// G_UserInfo["thisWorkout"] = req.session.User.workouts[TemplateID];
		render();
		return
	}

	render();
	
	async function render() {
		console.log("RENDER FUNCTION");
		// VUE STUFF		
		req.session.viewingWorkout = req.session.User.workouts[req.session.viewingWID];
		let vueJSON = req.session.viewingWorkout;
		vueJSON.thisWorkoutDate = new Date(req.session.User.workoutDates[req.session.viewingWID - 1]);
		let vueInfo = getVueInfo(vueJSON);
		G_vueOutput = vueInfo;
		G_vueOutput.workoutDates = req.session.User.workoutDates;
		// res.json(thisWorkout);
		
		var changeWorkoutList = [];
		var  WorkoutDict = req.session.User.workouts;
		for (var K in WorkoutDict) {
			var Workout = WorkoutDict[K];
			if (!Workout.ID) {
				continue;
			}
			var _W = Workout.Week;
			var _D = Workout.Day;
			var wID = Workout.ID;
			// var date = G_UserInfo["User"].workoutDates[wID - 1];
			var date = dateString(req.session.User.workoutDates[wID - 1]);
			// console.log("date", date, _W, _D, K);
			changeWorkoutList.push({Week: _W, Day: _D, Date: date, ID: wID});		
		}

		// console.log("379 user workouts", req.session.User.workouts);

		// thisUser.stats = G_UserInfo["User"].stats;
		// var workoutsClone = thisUser.workouts;
		var workoutsClone = req.session.User.workouts;		
		// console.log("379 viewingWID", req.session.viewingWID);
		// workoutsClone[req.session.viewingWID].Patterns = G_UserInfo["thisPatterns"];
		// req.session.User.workouts = workoutsClone;


		await req.session.User.save();
		// G_UserInfo["User"].save()
		// req.session.User.save().then(() => {
		var realUser = await User.findById(req.session.userId);
		realUser.workouts = req.session.User.workouts;
		await realUser.save();
		// req.session.User = await User.findById(req.session.userId);
		var thisWorkout = req.session.User.workouts[req.session.viewingWID];
		// console.log("thisWorkout 378", thisWorkout);
		var vWID = req.session.viewingWID;
		var WDateList = req.session.User.workoutDates;
		// console.log("RPEOptions", RPE_Dict["Options"]);
		// console.log("RPEDIct", RPE_Dict);
		sessionSave = req.session;
			res.render('main', 
			{
				User: req.session.User,
				ETypes: ExerciseDict["Types"],
				CurrentDate: dateString(WDateList[req.session.User.currentWorkoutID - 1]),
				ViewingDate: dateString(WDateList[req.session.viewingWID - 1]),
				ViewingWorkout: thisWorkout,
				thisWorkoutID: req.session.viewingWID,
				Patterns: thisWorkout.Patterns,				
				UserStats: req.session.User.stats,			

				levelUp: req.session.User["Level Up"],
				UBpressStat: req.session.User["UB Hor Push"],
				squatStat: req.session.User["Squat"],
				hingeStat: req.session.User["Hinge"],
				RPEOptions: RPE_Dict["Options"],
				selectedWeek,
				selectedDay,				
				selectWorkoutList: changeWorkoutList,
				allWorkouts: req.session.User.workouts,
				thisLevels: levelGroupsDict[req.session.User.levelGroup],
			});
	}
});

var sessionSave = {};

router.get('/tutorial', function (req, res) {
	res.render('tutorial');
});

router.post('/' + postURL, async (req, res) => {	
	
	
	var outputs = {};	
	var _User = sessionSave.User; //req.session could be empty because of CORS
	var _WID = sessionSave.viewingWID;
	var putBody = {};
	putBody = req.body;
	// putBody.viewingWID = _WID;
	// console.log("567", axiosPutResponse.data);
	var WorkoutURL = `/api/users/${_User.id}/workouts/${_WID}`;
	if (req.body.SaveBtn) {
		var axiosPutResponse = await axios.put(WorkoutURL + "/save", putBody,
		{ proxy: { host: '127.0.0.1', port: 3000 } });
		res.redirect('/');
		return;
	}
	if (req.body.SubmitBtn) {
		var axiosPutResponse = await axios.put(WorkoutURL + "/submit", putBody,
		{ proxy: { host: '127.0.0.1', port: 3000 } });
		if (axiosPutResponse.data.lastWorkout) {
			res.redirect('/level-up');
			return		
		}
		else {
			res.redirect('/');
			return			
		}
		// console.log("completing workout...");
		// var usr = G_UserInfo["User"];
		// // console.log(usr.workouts);
		// var wID = G_UserInfo["thisWorkoutID"];
		// // usr.currentworkoutID;
		// console.log(wID);
		// usr.workouts[wID].Completed = true;
		// usr.save();
		// thisUser.workouts = usr.workouts;
		// thisUser.save();
		// G_UserInfo["thisWorkout"].Completed = true;
		// G_UserInfo["User"].workouts[]
		// G_UserInfo["User"].save();
		res.redirect('/');
	}
	
	if (req.body.changeLevel || req.body.changeLGroup) {
		res.redirect('/');
		return;
	}

	// console.log("333");
	if (req.body.changeWorkoutBtn || req.body.NextBtn || req.body.PrevBtn) {
		if (req.body.changeWorkoutBtn) {
			var selectedWD = req.body.changeWorkoutSelect.split("|");
			var _W = parseInt(selectedWD[0]);
			var _D = parseInt(selectedWD[1]);
			var newWID = parseInt(req.body.changeWorkoutSelect);
			
			var newWorkout = req.session.User.workouts[req.body.changeWorkoutSelect];

			selectedWeek = parseInt(newWorkout.Week);
			selectedDay = parseInt(newWorkout.Day);
			// console.log("NEW WORKOUT ID: " + req.body.changeWorkoutSelect);
			// console.log("NEW WORKOUT: ", newWorkout, "Week: " + selectedWeek, "Day: " + selectedDay);
			// Using req.session
			req.session.viewingWID = newWID;
			// console.log("new WID: " + req.session.viewingWID
			// + " week: " + selectedWeek + " day: " + selectedDay);
			res.redirect('/');
			return;
		}
		else if (req.body.NextBtn || req.body.PrevBtn) {
			var nWorkouts = req.session.User.workoutDates.length;
			// console.log("nWorkouts: " + nWorkouts);
			var nextWorkoutID = req.session.viewingWID + 1;
			if (req.body.PrevBtn) {
				nextWorkoutID = req.session.viewingWID - 1;
				if (req.session.viewingWID == 1) {
					nextWorkoutID = nWorkouts;	
				}			
			} 
			if (nextWorkoutID > nWorkouts) {
				// console.log("redirecting to workout: " + nextWorkoutID);
				//"Submit" last workout here
				var levelUpStats = req.session.User.stats["Level Up"];
				if (!_User.stats["Level Up"].Status.Checked && _User.stats["Level Up"].Status.value == 1) {
					_User.level ++;
				}
				_User.stats["Level Up"].Status.Checked = true;
				// console.log("Going to level-up: ", _User.stats["Level Up"].Status);
				_User.changed( 'stats', true);
				await _User.save();
				// res.json(_User);
				res.redirect('/level-up');
				return
				// Test user here
			}
			// console.log("next Workout ID: " + nextWorkoutID);
			// G_UserInfo["thisWorkoutID"] = nextWorkoutID;
			// NOOOO
			//USE "VIEWING WORKOUT ID"
			// G_UserInfo["User"].currentWorkoutID = nextWorkoutID; 

			// Using req.session
			// console.log("nextWorkoutID 512", nextWorkoutID);
			selectedWeek = req.session.User.workouts[nextWorkoutID].Week;
			selectedDay = req.session.User.workouts[nextWorkoutID].Day;
			req.session.viewingWID = nextWorkoutID;
			res.redirect('/');
			return;
		}
	}

	if(req.body.ResetBtn) {
		// reset();
		res.redirect('/');
		return
	}
});

router.get('/level-up', async function(req, res) {
	var _UserData = await axios.get(`/api/users/${req.session.User.id}`, { proxy: { host: '127.0.0.1', port: 3000 } });
	var _User = _UserData.data;
	var newLevel = _User.level;
	var oldLevel = (_User.stats["Level Up"].Status.value == 1) ? newLevel - 1 : newLevel;

	res.render('levelcheck', {
		User: _User,
		oldLevel,
		newLevel,
		UserStats: _User.stats,			
		levelUp: _User.stats["Level Up"],
		benchStat: _User.stats["UB Hor Push"],
		squatStat: _User.stats["Squat"],
		hingeStat: _User.stats["Hinge"],		
	});
})

router.post('/', function(req, res) {
	res.redirect("/");
});

router.post('/workouts', function(req, res) {
	res.redirect("/workouts");
});

router.get('/workouts', function(req, res) {
	// WorkoutTemplate.destroy({where: {}});
	// SubWorkoutTemplate.destroy({where: {}});
	// res.render('templates', {});
	var subWorkoutPromises = [];
	var workoutDict = {1: [], 2: [], 3: [], 4: []};
	var subsDict = {1: [], 2: [], 3: [], 4: []};

	WorkoutTemplate.findAll({
		where: {},
		order: [['week', 'ASC'], ['day', 'ASC']],
	}).then(results => {
		results.forEach(elem => {
			if (elem.day == 4) {
				elem.destroy();
			}
			else {
				subWorkoutPromises.push(elem.getSubWorkouts());
			}
		})
		Promise.all(subWorkoutPromises).then(subworkouts => {
			subworkouts.forEach(subList => {
				subList.sort(function(a, b) {
					return a.number - b.number
				});
			});
			// console.log(subworkouts);
			for (var i = 0; i < results.length; i ++) {
				var W = results[i];
				var S = subworkouts[i];
				console.log("Day: " + W.day);
				// console.log(workoutDict[W.day]);
				console.log(S);
				workoutDict[W.day].push(W);
				subsDict[W.day].push(S);
			}

			// var rowNum = results.length/4;
			thisUser.save();
			res.render('templates', {
				// Subworkouts: subworkouts,
				// Workouts: results,
				Subworkouts: subsDict,
				Workouts: workoutDict,
				// rowNum,
			});
		});
	});
});



function reset() {
	UserStats = {
		Level: 1,
		AlloyPerformed: {
			"UB Hor Push": 0, 
			"UB Vert Push": 0, 
			"UB Hor Pull": 0, 
			"UB Vert Pull": 0, 
			"Hinge": 0,
			"Squat": 0, 
			"LB Uni Push": 0, 
			"Ant Chain": 0, 
			"Post Chain": 0, 
			"Carry": 0, 
			"Iso 1": 0, 
			"Iso 2": 0, 
			"Iso 3": 0, 
			"Iso 4": 0, 		
		},
		ExerciseStats: {
			"UB Hor Push": {Status: Alloy.None, Max: 100, LastSet: ""}, 
			"UB Vert Push": {Status: Alloy.None, Max: 100, LastSet: ""}, 
			"UB Hor Pull": {Status: Alloy.None, Max: 100, LastSet: ""}, 
			"UB Vert Pull": {Status: Alloy.None, Max: 100, LastSet: ""}, 
			"Hinge": {Status: Alloy.None, Max: 100, LastSet: ""},
			"Squat": {Status: Alloy.None, Max: 100, LastSet: ""}, 
			"LB Uni Push": {Status: Alloy.None, Max: 100, LastSet: ""}, 
			"Ant Chain": {Status: Alloy.None, Max: 100, LastSet: ""}, 
			"Post Chain": {Status: Alloy.None, Max: 100, LastSet: ""}, 
			"Carry": {Status: Alloy.None, Max: 100, LastSet: ""}, 
			"Iso 1": {Status: Alloy.None, Max: 100, LastSet: ""}, 
			"Iso 2": {Status: Alloy.None, Max: 100, LastSet: ""}, 
			"Iso 3": {Status: Alloy.None, Max: 100, LastSet: ""}, 
			"Iso 4": {Status: Alloy.None, Max: 100, LastSet: ""}, 
		},
		CurrentSets: {
	
		},
		CurrentWorkout: {
			Week: 1,
			Day: 1,
			LGroup: 1,
			TemplateID: 1,
		},
		TemplateID: 1,
	 }
	 return;
	}
	
module.exports = router;