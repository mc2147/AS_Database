var RPETable = require('./RPETable');
var Exercises = require('./Exercises');
var Workouts1 = require('./Workouts1');
var Workouts2 = require('./Workouts2');
var Workouts3a = require('./Workouts3a');
var Workouts3b = require('./Workouts3b');
var Workouts4a = require('./Workouts4a');
var Workouts4b = require('./Workouts4b');
var VideosJSON = require('./JSON/Videos').VideosJSON;
var VideosVue = require('./JSON/Videos').vueConvert;
var DescriptionsJSON = require('./JSON/Descriptions');

// export default VideosJSON;

var ExerciseDict = Exercises.ExerciseDict;

var AllWorkouts = {};
AllWorkouts[1] = Workouts1;
AllWorkouts[2] = Workouts2;
AllWorkouts[3] = {}
AllWorkouts[3]["a"] = Workouts3a;
AllWorkouts[3][1] = Workouts3a;
AllWorkouts[3]["b"] = Workouts3b;
AllWorkouts[3][2] = Workouts3b;
AllWorkouts[4] = {}
AllWorkouts[4]["a"] = Workouts4a;
AllWorkouts[4][1] = Workouts4a;
AllWorkouts[4]["b"] = Workouts4b;
AllWorkouts[4][2] = Workouts4b;

// export default {
//     VideosJSON,
//     AllWorkouts,
//     Workouts1,
//     Workouts2,
//     Workouts3a,
//     Workouts3b,
//     Workouts4a,
//     Workouts4b,
//     ExerciseDict,
//     RPETable,
// };

// console.log(VideosJSON);

module.exports = {
    VideosVue,
    VideosJSON,
    AllWorkouts,
    Workouts1,
    Workouts2,
    Workouts3a,
    Workouts3b,
    Workouts4a,
    Workouts4b,
    ExerciseDict,
    RPETable,
    DescriptionsJSON,
}
