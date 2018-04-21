'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.signupUser = signupUser;
exports.assignLevel = assignLevel;
exports.assignWorkouts = assignWorkouts;
exports.getblankPatterns = getblankPatterns;

var _functions = require('../globals/functions');

var _data = require('../data');

var _enums = require('../globals/enums');

var _models = require('../models');

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _bcryptjs = require('bcryptjs');

var _bcryptjs2 = _interopRequireDefault(_bcryptjs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var saltRounds = 10;

function generateSalt() {
    return _bcryptjs2.default.genSaltSync(saltRounds);
}
function generateHash(password, salt) {
    return _bcryptjs2.default.hashSync(password, salt, null);
}

async function signupUser(input) {
    var P1 = input.P1;
    var P2 = input.P2;
    var username = input.username;
    var salt = generateSalt();
    if (P1 == P2) {
        var hashedPassword = generateHash(P1, salt);
        var newUser = await _models.User.create({
            // id: 29,
            username: username,
            salt: salt,
            password: hashedPassword
        });
        if (newUser) {
            return {
                newUser: newUser,
                session: {
                    userId: newUser.id,
                    username: username,
                    User: newUser
                }
            };
        } else {
            return {
                error: true,
                status: "error"
            };
        }
    } else {
        return false;
    }
}

async function assignLevel(_User, input) {
    var squatWeight = input.squatWeight,
        benchWeight = input.benchWeight,
        RPEExp = input.RPEExp,
        bodyWeight = input.bodyWeight;

    if (squatWeight < benchWeight) {
        _User.level = 1;
    } else if (squatWeight > bodyWeight * 1.5 && benchWeight > bodyWeight && RPEExp) {
        _User.level = 11;
    } else {
        _User.level = 6;
    }
    await _User.save();
}

//Assigns a set of workouts to the user depending on level, start date, and workout days (list) 
// Required format:
// ["Day-1"], ["Day-2"], ["Day-3"], ["Day-4"]
// .startDate -> "YYYY-M-D" 
// .workoutLevel = level
// .workoutBlock = user.blockNum
async function assignWorkouts(_User, input) {
    var newUser = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    // console.log("creating workouts from: ", input);
    if (!newUser) {
        var dateSplit = input.startDate.split("-");
        var dateNow = Date.now();
        input.dateObj2 = new Date(parseInt(dateSplit[0]), parseInt(dateSplit[1] - 1), parseInt(dateSplit[2] - 1));
    }
    if (newUser) {
        input.dateObj2 = input.startDate;
    }
    var daysList = [parseInt(input["Day-1"]), parseInt(input["Day-2"]), parseInt(input["Day-3"])];
    var Level = parseInt(input.workoutLevel); //Determine N Workouts based on that
    var Group = 0;
    var Block = parseInt(input.workoutBlock);
    Level = _User.level;
    Block = _User.blockNum;

    var TemplatesJSON = {};
    input.level = Level;
    if (Level <= 5) {
        Group = 1;
        TemplatesJSON = _data.AllWorkouts[Group];
    } else if (Level <= 10) {
        Group = 2;
        TemplatesJSON = _data.AllWorkouts[Group];
        daysList.push(parseInt(input["Day-4"]));
    } else if (Level <= 16) {
        Group = 3;
        // Block = "a";
        TemplatesJSON = _data.AllWorkouts[Group][Block];
        daysList.push(parseInt(input["Day-4"]));
    } else {
        Group = 4;
        // Block = "a";
        TemplatesJSON = _data.AllWorkouts[Group][Block];
        daysList.push(parseInt(input["Day-4"]));
    }
    var nWorkouts = Object.keys(TemplatesJSON.getWeekDay).length;
    input.nWorkouts = nWorkouts;
    input.daysList = daysList;

    var workoutDates = (0, _functions.getWorkoutDays)(input.dateObj2, daysList, Level, "", nWorkouts);
    input.workoutDates = workoutDates;
    input.detailedworkoutDates = [];
    workoutDates.forEach(function (elem) {
        var item = [elem];
        item.push(_enums.DaysofWeekDict[elem.getDay()]);
        input.detailedworkoutDates.push(item);
    });
    var Templates = TemplatesJSON.Templates;
    input.workouts = {};
    for (var W in Templates) {
        var thisWeek = Templates[W];
        for (var D in thisWeek) {
            var ID = thisWeek[D].ID;
            input.workouts[ID] = {
                ID: null,
                Week: null,
                Day: null,
                Date: null,
                Completed: false,
                Patterns: []
            };
            input.workouts[ID].Week = W;
            input.workouts[ID].Day = D;
            input.workouts[ID].ID = ID;
            var thisworkoutDate = workoutDates[ID - 1];
            input.workouts[ID].Date = thisworkoutDate;
            var describerPrefix = "Level " + Level;
            var blockString = "";
            if (_User.blockNum != 0) {
                if (_User.blockNum == 1) {
                    blockString = ", Block 1: Volume";
                } else if (_User.blockNum == 2) {
                    blockString = ", Block 2: Strength/Power";
                }
            }
            var Describer = describerPrefix + blockString + " - " + " Week " + W + ", Day " + D;
            input.workouts[ID].Describer = Describer;
            var subsURL = '/api/workout-templates/' + _User.levelGroup + '/block/' + _User.blockNum + '/week/' + W + '/day/' + D + '/subworkouts';
            var subsResponse = await _axios2.default.get(subsURL, { proxy: { host: 'localhost', port: 3000 } });
            var subsList = subsResponse.data;
            console.log("subList for: ", W, D, subsList.length);
            // input.workouts[ID].Patterns = subsList;
            // console.log("line 80 subsList",subsList);
            subsList.sort(function (a, b) {
                return a.number - b.number;
            });
            for (var i = 0; i < subsList.length; i++) {
                var sub = subsList[i];
                var patternInstance = sub.patternFormat;
                var EType = sub.exerciseType;
                if (EType == "Med Ball") {
                    EType = "Medicine Ball";
                } else if (EType == "Vert Pull") {
                    EType = "UB Vert Pull";
                }
                patternInstance.type = EType;
                var EName = _data.ExerciseDict.Exercises[patternInstance.type][Level].name;
                patternInstance.name = EName;
                console.log("97");
                var findVideo = await _models.Video.search(EName, false);
                console.log("99");
                if (findVideo) {
                    patternInstance.hasVideo = true;
                    patternInstance.videoURL = findVideo.url;
                    patternInstance.selectedVideo = {
                        URL: findVideo.url,
                        label: findVideo.title,
                        image: "../../static/video_placeholder.png",
                        description: findVideo.description,
                        LevelAccess: findVideo.levelAccess
                    };

                    var LevelList = [];
                    for (var i = 1; i <= 25; i++) {
                        LevelList.push(i);
                    }
                    patternInstance.selectedVideo.levels = LevelList.slice(findVideo.LevelAccess - 1);
                }
                input.workouts[ID].Patterns.push(patternInstance);
                console.log("Pushing sub for Pattern: ", ID);
            }
            console.log(ID, "Patterns: ", input.workouts[ID].Patterns.length);
        }
    }
    _User.workouts = input.workouts;
    _User.currentWorkoutID = 1;
    _User.workoutDates = workoutDates;
    _User.resetStats = true;
}

async function getblankPatterns(lGroup, block, W, D, level) {
    var blankPatterns = [];
    var subsURL = '/api/workout-templates/' + lGroup + '/block/' + block + '/week/' + W + '/day/' + D + '/subworkouts';
    var subsResponse = await _axios2.default.get(subsURL, { proxy: { host: 'localhost', port: 3000 } });
    var subsList = subsResponse.data;
    subsList.sort(function (a, b) {
        return a.number - b.number;
    });
    for (var i = 0; i < subsList.length; i++) {
        var sub = subsList[i];
        var patternInstance = sub.patternFormat;
        var EType = sub.exerciseType;
        if (EType == "Med Ball") {
            EType = "Medicine Ball";
        } else if (EType == "Vert Pull") {
            EType = "UB Vert Pull";
        }
        patternInstance.type = EType;
        var EName = _data.ExerciseDict.Exercises[patternInstance.type][level].name;
        patternInstance.name = EName;
        var findVideo = await _models.Video.search(EName, false);
        if (findVideo) {
            patternInstance.hasVideo = true;
            patternInstance.videoURL = findVideo.url;
            patternInstance.selectedVideo = {
                URL: findVideo.url,
                label: findVideo.title,
                image: "../../static/video_placeholder.png",
                description: findVideo.description,
                LevelAccess: findVideo.levelAccess
            };

            var LevelList = [];
            for (var i = 1; i <= 25; i++) {
                LevelList.push(i);
            }
            patternInstance.selectedVideo.levels = LevelList.slice(findVideo.LevelAccess - 1);
        }
        blankPatterns.push(patternInstance);
    }
    console.log("getBlankPatterns: ", blankPatterns);
    return blankPatterns;
}