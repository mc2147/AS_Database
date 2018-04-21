import {Alloy} from '../globals/enums';
var axios = require('axios');

var globalFuncs = require('../globals/functions');
	var getMax = globalFuncs.getMax;
	var getWeight = globalFuncs.getWeight;

async function saveWorkout(body, userInstance, vWID, submit=false) {
    console.log("workoutHandler 8");        
    var lastSets = {};
    var allWorkouts = userInstance.workouts;
    var thisWorkout = allWorkouts[vWID];
    if (submit) {
        thisWorkout.Completed = true;                        
    }
    var selectedPatterns = allWorkouts[vWID].Patterns;
    var allStats = userInstance.stats;
    for (var K in body) {
        var inputCode = K.split("|");
        console.log("K 21: ", K);
        if (!K.includes("|") || !inputCode) {
            continue;
        }
        console.log("inputCode: ", inputCode);
        var patternID = parseInt(inputCode[0]); //Number (index + 1)
        var patternIndex = patternID - 1;
        
        var thisPattern = selectedPatterns[patternIndex];
        
        var _EType = thisPattern.type; //Getting undefined error
        var _nSets = thisPattern.sets;

        var inputType = inputCode[1];
        var setNum = parseInt(inputCode[2]);
        var setIndex = setNum - 1;


        var setDict = thisPattern.setList[setIndex];

        var input = parseInt(body[K]);
        
        var thisStats = allStats[_EType];

        // Getting Input types: Weight, RPE, Tempo, Reps 
        if (inputType == "W" 
            && input && setNum <= _nSets) {
            setDict.Weight = parseInt(body[K]);
            if (setDict.RPE || thisPattern.workoutType == 'carry') {
                setDict.Filled = true;
            } 
        }
        else if (inputType == "RPE" 
            && input && setNum <= _nSets) {
            setDict.RPE = body[K];
            if (setDict.Weight) {
                setDict.Filled = true;
            }
            if (thisPattern.workoutType == "bodyweight" && setDict.Reps) {
                setDict.Filled = true;
            }
        }
        else if (inputType.includes("T") 
            && input && setNum <= _nSets) {
            setDict.Tempo.push(parseInt(body[K]));
        }
        else if (inputType == "Reps") {
            setDict.Reps = parseInt(body[K]);
            if (thisPattern.workoutType == 'bodyweight' && setDict.RPE) {
                console.log("395");
                setDict.Filled = true;
            }
        }

        // Check if last set
        if (setNum == _nSets) {
            if (!(_EType in lastSets)) {
                lastSets[_EType] = {
                    Tempo: [],
                    Name: thisPattern.name, 
                    Reps: setDict.Reps,
                    Alloy: thisPattern.alloy,
                    AlloyReps: thisPattern.alloyreps,
                    ID: patternID,
                };
            }
            if (inputType == "W") {
                lastSets[_EType].Weight = parseInt(body[K]);
            }
            else if (inputType == "RPE") {
                lastSets[_EType].RPE = body[K];
                if(thisPattern.drop && thisPattern.specialStage) {
                    lastSets[_EType].Weight = thisPattern.dropWeight;
                }
            }
            else if (inputType.includes("T")) {
                lastSets[_EType].Tempo.push(parseInt(body[K]));
            }
        }
        // Check if alloy
        else if (inputCode[2] == "Alloy") {
            var RepPerformance = parseInt(body[K]);
            thisPattern.alloyperformed = RepPerformance;
            if (RepPerformance >= thisPattern.alloyreps) {
                
                thisStats.Status = Alloy.Passed;
                thisPattern.alloystatus = Alloy.Passed;
                
                console.log("ALLOY PASSED");				
            }
            else {
                
                thisStats.Status = Alloy.Failed;
                thisPattern.alloystatus = Alloy.Failed;

                console.log("ALLOY FAILED");				
            }
            
            var setDescription = RepPerformance + " Reps x " + thisPattern.alloyweight 
            + " lbs @ " + 10 + " RPE (Alloy) " + allStats[_EType].Status.string;
            console.log("_EType Error: " + _EType);
            thisStats.LastSet = setDescription;
            thisPattern.LastSet = setDescription;

            thisStats.Name = thisPattern.name;
        }
    }

    // userInstance.workouts = allWorkouts;    
    // userInstance.stats = allStats;

    // await userInstance.save();
    
    for (var EType in lastSets) {
        var Val = lastSets[EType];
        var lastSetStat = allStats[EType];
        // If last set was filled completely
        if (Val.Weight && Val.RPE && Val.Reps) {
            var setDescription = Val.Reps + " Reps x " + Val.Weight + " lbs @ " + Val.RPE + " RPE";
            var lastSetPattern = selectedPatterns[Val.ID - 1];
            // Stop & Drop Sets
            if (lastSetPattern.stop) {
                console.log("stop set submitted ", lastSetPattern.specialValue);
                if (lastSetPattern.specialStage == 0) {
                    if (parseFloat(Val.RPE) < lastSetPattern.specialValue) {
                        lastSetPattern.sets += 1;
                        lastSetPattern.setList.push({
                            SetNum: lastSetPattern.sets,
                            Weight: null,
                            RPE: null,
                            Reps: lastSetPattern.reps,
                            // Tempo: [null, null, null],
                            Filled: false,
                        });				 
                    }
                    else {
                        lastSetPattern.specialStage += 1;
                    }
                }
            }
            //DROP SETS
            else if (lastSetPattern.drop) {
                console.log("drop set submitted. Drop Stage: " + lastSetPattern.specialStage, lastSetPattern.SuggestedRPE, parseFloat(Val.RPE));
                if (lastSetPattern.specialStage == 0) {
                    if (parseFloat(Val.RPE) < lastSetPattern.dropRPE) {
                        lastSetPattern.sets += 1;
                        lastSetPattern.setList.push({
                            SetNum: lastSetPattern.sets,
                            Weight: null,
                            RPE: null,
                            SuggestedRPE: lastSetPattern.dropRPE,
                            Reps: lastSetPattern.reps,
                            Filled: false,
                        });				 
                    }
                    else {
                        lastSetPattern.specialStage += 1;
                        lastSetPattern.dropWeight =  Math.round(((100 - lastSetPattern.specialValue)/100)*Val.Weight);
                        lastSetPattern.sets += 1;
                        lastSetPattern.setList.push({
                            SetNum: lastSetPattern.sets,
                            Weight: lastSetPattern.dropWeight,
                            RPE: null,
                            SuggestedRPE: lastSetPattern.dropRPE,
                            Reps: lastSetPattern.reps,
                            Filled: false,
                        });				  					
                    }
                }
                else if (lastSetPattern.specialStage == 1) {
                    if (parseFloat(Val.RPE) < lastSetPattern.dropRPE) {
                        lastSetPattern.sets += 1;
                        lastSetPattern.setList.push({
                            SetNum: lastSetPattern.sets,
                            Weight: lastSetPattern.dropWeight,
                            RPE: null,
                            SuggestedRPE: lastSetPattern.dropRPE,
                            Reps: lastSetPattern.reps,
                            Filled: false,
                        })
                    }
                    else {
                        lastSetPattern.specialStage += 1;
                    }
                }
            }
            
            lastSetStat.LastSet = setDescription; 
            lastSetStat.Name = thisPattern.name;
            lastSetPattern.LastSet = setDescription;

            console.log("	Calculating new max with inputs: " + Val.Weight + ", " + Val.Reps + ", " + Val.RPE);
            var newMax = getMax(Val.Weight, Val.Reps, Val.RPE);
            console.log("	New MAX: " + getMax(Val.Weight, Val.Reps, Val.RPE));

            lastSetStat.Max = newMax;
            lastSetPattern.Max = newMax;			

            // Alloy Set Case
            if (Val.Alloy) {
                var AlloyReps = Val.AlloyReps; 
                var AlloyWeight = getWeight(newMax, AlloyReps, 10);

                lastSetPattern.alloyweight = AlloyWeight;
                lastSetPattern.alloystatus = Alloy.Testing;
                lastSetStat.Status = Alloy.Testing;

                console.log("Alloy Show: ", lastSetPattern.alloystatus, " last set: ", EType, Val.ID);
            }
        }
    }    

    userInstance.stats = allStats;
    userInstance.workouts = allWorkouts;    

    // await userInstance.save();

    var squatStatus = userInstance.stats["Squat"].Status;
    var benchStatus = userInstance.stats["UB Hor Push"].Status;
    var hingeStatus = userInstance.stats["Hinge"].Status;

    var copiedStats = userInstance.stats;

    copiedStats["Level Up"].Squat = squatStatus;
    copiedStats["Level Up"].UBHorPush = benchStatus;
    copiedStats["Level Up"].Hinge = hingeStatus;

    // console.log("copied Level Up: \n\n", copiedStats["Level Up"]);
    // console.log("Level UP?", squatStatus.value == 1, benchStatus.value == 1, hingeStatus.value == 1)

    if (squatStatus.value == 1
        && benchStatus.value == 1
        && hingeStatus.value == 1) {
            copiedStats["Level Up"].Status = Alloy.Passed;
    }
    else if (squatStatus == Alloy.Failed
        || benchStatus == Alloy.Failed
        || hingeStatus == Alloy.Failed) {
            copiedStats["Level Up"].Status = Alloy.Failed;
    }
    else if (
        (squatStatus == Alloy.None || squatStatus == Alloy.Testing)
        || (benchStatus == Alloy.None || benchStatus == Alloy.Testing)
        || (hingeStatus == Alloy.None || hingeStatus == Alloy.Testing)
        ) {
            copiedStats["Level Up"].Status = Alloy.Testing;
    }
    console.log("\n\n copied Level Up 2: \n\n", copiedStats["Level Up"]);
    
    userInstance.stats = copiedStats;
    await axios.put(process.env.BASE_URL + `/api/users/${userInstance.id}/stats`, copiedStats);
    await axios.put(process.env.BASE_URL + `/api/users/${userInstance.id}/workouts`, allWorkouts);
    // await userInstance.save();

    // console.log("WH 312 Patterns \n");
    // userInstance.workouts[vWID].Patterns.forEach((elem) => {
    //     console.log("alloy Status: ", elem.alloystatus);
    // })

}

module.exports = {
    saveWorkout,
}