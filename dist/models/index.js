'use strict';

var Sequelize = require('sequelize');
var bcrypt = require('bcryptjs');
var globalTemplates = require('../globals/templates');
var userStatTemplate = globalTemplates.userStatTemplate;

var _require = require('../globals/enums'),
    Alloy = _require.Alloy;

// import {Alloy} from '../globals/enums';

// var globalFuncs = require('../globals/functions');
// var data = require('../data');
// var ExerciseDict = data.ExerciseDict.Exercises;


var db = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost:5432/AS_db', {
    logging: false,
    dialectOptions: { decimalNumbers: true }
});

var Exercise = db.define('Exercise', {
    type: {
        type: Sequelize.STRING
    },
    name: {
        type: Sequelize.STRING,
        allowNull: true
    },
    level: {
        type: Sequelize.INTEGER
    },
    bodyweight: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
});

var Video = db.define('Video', {
    title: {
        type: Sequelize.STRING
    },
    url: {
        type: Sequelize.STRING
    },
    levelAccess: {
        type: Sequelize.INTEGER
    },
    exerciseNames: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
    },
    tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        set: function set(value) {
            this.setDataValue('tags', value.split(" "));
        }
    },
    description: {
        type: Sequelize.TEXT,
        defaultValue: ""
    }
});

Video.search = function (name, exhaustive) {
    // console.log("searching for video: ", name);
    var searchTerms = [name];
    if (exhaustive) {
        return Video.findOne({
            where: {
                tags: {
                    $overlap: name.split(" ")
                }
            }
        });
    } else {
        return Video.findOne({
            where: {
                exerciseNames: {
                    $overlap: [name]
                }
            }
        });
    }
};

var WorkoutTemplate = db.define('WorkoutTemplate', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    number: {
        type: Sequelize.INTEGER
    },
    levelGroup: {
        type: Sequelize.INTEGER
    },
    block: {
        type: Sequelize.INTEGER
    },
    week: {
        type: Sequelize.INTEGER
    },
    day: {
        type: Sequelize.INTEGER
    },
    NSubworkouts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    }
});

var SubWorkoutTemplate = db.define('SubWorkoutTemplate', {
    number: {
        type: Sequelize.INTEGER
        // primaryKey: true,
        // autoIncrement:true,
    },
    exerciseType: {
        type: Sequelize.STRING,
        allowNull: true
    },
    type: {
        type: Sequelize.ENUM,
        values: ['normal', 'bodyweight', 'carry', 'stop', 'drop', 'deload', 'alloy'],
        defaultValue: 'normal'
    },
    specialValue: {
        type: Sequelize.DECIMAL,
        allowNull: true
    },
    sets: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    // Normal Reps and RPE
    reps: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    RPE: {
        type: Sequelize.DECIMAL,
        allowNull: true
    },
    // Split Cases (Reps and RPE)
    repsList: {
        type: Sequelize.ARRAY(Sequelize.DECIMAL),
        defaultValue: [],
        allowNull: true
    },
    RPEList: {
        type: Sequelize.ARRAY(Sequelize.DECIMAL),
        defaultValue: [],
        allowNull: true
    },
    // Range Cases (RPEs)
    RPERange: {
        type: Sequelize.RANGE(Sequelize.DECIMAL),
        defaultValue: [],
        allowNull: true
    },
    // Alloy and Special
    alloy: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true
    },
    alloyreps: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    deload: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    description: {
        type: Sequelize.STRING,
        defaultValue: "description"
    }
}, {
    getterMethods: {
        patternFormat: function patternFormat() {
            var pattern = {};
            var EType = this.exerciseType;
            pattern.number = this.number;
            pattern.type = EType;
            pattern.reps = this.reps;

            // pattern.name = eName;	
            pattern.setList = [];
            pattern.sets = this.sets;
            pattern.workoutType = this.type;

            // Alloy Condition
            pattern.alloy = this.alloy;
            if (pattern.alloy) {
                pattern.alloyreps = this.alloyreps;
                pattern.alloystatus = Alloy.None;
                pattern.sets -= 1;
            }
            // Name Exceptions Condition        
            if (pattern.type == "Med Ball") {
                pattern.type = "Medicine Ball";
            } else if (pattern.type == "Vert Pull") {
                pattern.type = "UB Vert Pull";
            }

            if (pattern.workoutType == "stop") {
                pattern.stop = true;
                pattern.specialValue = this.specialValue;
                pattern.specialString = this.specialValue + " RPE";
                pattern.sets = 1;
                pattern.specialStage = 0;
            } else if (pattern.workoutType == "drop") {
                pattern.drop = true;
                pattern.specialValue = this.specialValue;
                pattern.specialString = this.specialValue + " %";
                pattern.dropRPE = this.RPE;
                pattern.sets = 1;
                pattern.specialStage = 0;
            }

            if (this.RPE) {
                pattern.RPE = this.RPE;
            }

            for (var i = 0; i < pattern.sets; i++) {
                var Reps = this.reps;
                var RPE = this.RPE;
                // Check for RPE Ranges
                if (this.RPE == null) {
                    if (this.RPERange.length > 0) {
                        RPE = this.RPERange[0] + "-" + this.RPERange[1];
                        pattern.RPE = RPE;
                    } else if (this.repsList.length > 0) {
                        Reps = parseInt(this.repsList[i]);
                        RPE = this.RPEList[i];
                    } else {
                        RPE = "---";
                    }
                }
                pattern.setList.push({
                    SetNum: i + 1,
                    Weight: null,
                    RPE: null,
                    SuggestedRPE: RPE,
                    Reps: Reps,
                    // Tempo: [null, null, null],
                    Filled: false
                });
            }
            return pattern;
        }
    }
});

var User = db.define('User', {
    // id: {
    //     type: Sequelize.INTEGER,
    //     // allowNull: true,
    //     primaryKey: true,
    //     autoIncrement: true,
    // },  
    username: { //Check for email later
        type: Sequelize.STRING,
        // unique: true,
        allowNull: true //Change soon
        // defaultValue: "", 
        // primaryKey: true,
    },
    password: {
        type: Sequelize.STRING,
        allowNull: true, //Change soon
        defaultValue: ""
    },
    salt: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: ""
    },
    level: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: true
    },
    blockNum: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    stats: {
        type: Sequelize.JSON,
        defaultValue: {},
        allowNull: true
    },
    oldstats: {
        type: Sequelize.ARRAY(Sequelize.JSON),
        defaultValue: [],
        allowNull: true
    },
    levelGroup: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: true
    },
    workouts: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
        //ID'd by workout # (per L Group, Block)
        //Can have a "current" value to quickly get current workout
        //Missing workout case:
        //Shift workoutDates by 1 after current(?)
        //Reassign (completed) to all
    },
    oldworkouts: {
        type: Sequelize.ARRAY(Sequelize.JSON),
        defaultValue: [],
        allowNull: true
    },
    currentWorkoutID: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: true
    },
    currentWorkout: { //Deprecated
        type: Sequelize.JSON,
        defaultValue: {},
        allowNull: true
    },
    workoutDates: {
        allowNull: true,
        type: Sequelize.ARRAY(Sequelize.DATE),
        //Same dates as with workouts, ID'd by workout # (per L Group, Block)
        //For easy indexing with workouts, finding closest date, etc.
        defaultValue: []
    },
    // currentWorkoutID: {
    //     type: Sequelize.INTEGER,
    //     //To easily find current/next workout
    // },
    startDate: {
        type: Sequelize.DATE,
        allowNull: true
    },
    signUpDate: {
        type: Sequelize.DATE,
        allowNull: true
        // thisPatterns: [],
    } }, {
    setterMethods: {
        resetStats: function resetStats() {
            this.setDataValue('stats', userStatTemplate);
        }
    }
});

User.generateHash = function (password, salt) {
    return bcrypt.hashSync(password, salt, null);
};

SubWorkoutTemplate.belongsTo(WorkoutTemplate, { foreignKey: 'fk_workout', foreignKeyConstraint: true });
WorkoutTemplate.hasMany(SubWorkoutTemplate, { foreignKey: 'fk_workout', as: 'subWorkouts' });

var Workout = db.define('Workout', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    week: {
        type: Sequelize.INTEGER
    },
    day: {
        type: Sequelize.INTEGER
    }
});

// db.sync({force: true});
// db.sync();

module.exports = {
    db: db,
    Exercise: Exercise,
    WorkoutTemplate: WorkoutTemplate,
    Workout: Workout,
    User: User,
    SubWorkoutTemplate: SubWorkoutTemplate,
    Video: Video
};