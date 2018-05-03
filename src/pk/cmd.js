const R = require("ramda");
const Data = require("./data.js");
const Characters = require("./chardb.js");
const Battle = require("./battle.js");

var encounter;

function beginBattleEncounter(t1list, t2list)
{
    var chars = Characters.loadDb("chars.json");

    var team1 = R.zipObj(t1list, R.map(Characters.getMonByName(chars), t1list));
    var team2 = R.zipObj(t2list, R.map(Characters.getMonByName(chars), t2list));
    encounter = new Battle.Encounter(team1, team2, chars);
    console.log(encounter);

    return { 
        message: 
`
Battle Start:
***Team 1***
${t1list.join()}
***Team 2***
${t2list.join()}
`
    }
}

function finishBattleEncounter()
{
    if (encounter) {
        encounter = null;
        return { message: "Battle over." };
    }

    return { error: "No battle in progress." };
}

function heal(id, amt) {
    if (!encounter) return { 
        error: "No battle in progress." 
    };

    
}

function reduceSpaces(s) {
    const Re = /\s+/g;
    return s.replace(Re, " ");
}

function doCmd(param) {
    const encounterRe = /encounter ((\w+\s*)+) vs\.\s+((\w+\s*)+)/g;

    var startEncounter = encounterRe.exec(param);
    if (startEncounter) {

        if (encounter) return { error: "Encounter already in progress!" };

        var t1 = reduceSpaces(startEncounter[1]).split(" ");
        var t2 = reduceSpaces(startEncounter[3]).split(" ");
        // console.log(t1, t2);
        return Promise.resolve(R.merge({}, beginBattleEncounter(t1, t2)));
    }

    if (param === "endencounter")
        return Promise.resolve(R.merge({}, finishBattleEncounter()));

    //if (param === "heal") {
    //    return R.merge({}, heal());
    //}

    return Promise.resolve({});
}

function effectiveMsg(mon, move) {
    const defMul = Data.TypeChart[move.Type];
    var typeEff = defMul[mon.PrimaryType];
    if (mon.SecondaryType != "") {
        typeEff *= defMul[mon.SecondaryType];
    }

    if (typeEff < 1)
        return "It's not very effective...";
    if (typeEff > 1)
        return "It's super effective!";
    
    return "";
}

const messageRe = /(\w+) uses \"(.+?)\" against (\w+)/;
function matchBattleMessage(text) {
    // console.log(text);
    var match = messageRe.exec(text);
    if (match) {
        // console.log(match);

        var atk = encounter.getMon(match[1]);
        var move = Data.MovesByName[match[2]];
        var def = encounter.getMon(match[3]);

        if (atk.current.hp <= 0) return { message: `${atk.name} can't fight!` };
        if (def.current.hp <= 0) return { message: `${def.name} is already defeated!` };

        var dmg = Battle.useMove(atk, def, move);
        var hl = def.current.hp;
        var ht = def.activeStats.hp;
        var emsg = effectiveMsg(def, move);
        var remmsg = `${emsg} ***${def.name}*** has ***${hl}/${ht}*** remaining.`;
        var msg = `***${atk.name}*** does ***${dmg}*** damage to ***${def.name}***!` + "\r\n" + `${remmsg}`;

        if (def.current.hp <= 0) {
            msg += "\r\n" + `***${def.name}*** fainted and can't continue fighting!`;
        }

        return { message: msg };  
    }
}

function isEncounterActive() {
    return encounter != null;
}

module.exports = { 
    doCmd: doCmd,
    matchBattleMessage: matchBattleMessage,
    isEncounterActive: isEncounterActive,
    matchBattleMessage: matchBattleMessage
};