const fs = require("fs");
const Data = require("./data.js");
const R = require("ramda");

const Nature = {
    "Hardy": ["",""],
    "Lonely":	["Attack",	"Defense"],
    "Brave":	["Attack",	"Speed"],
    "Adamant":	["Attack",	"Sp. Attack"],
    "Naughty":	["Attack",	"Sp. Defense"],
    "Bold":	    ["Defense",	"Attack"],
    "Docile":	["—",	"—"],
    "Relaxed":	["Defense",	"Speed"],
    "Impish":	["Defense",	"Sp. Attack"],
    "Lax":	    ["Defense",	"Sp. Defense"],
    "Timid":	["Speed",	"Attack"],
    "Hasty":	["Speed",	"Defense"],
    "Serious":	["—",	"—"],
    "Jolly":	["Speed",	"Sp. Attack"],
    "Naive":	["Speed",	"Sp. Defense"],
    "Modest":	["Sp. Attack",	"Attack"],
    "Mild":	    ["Sp. Attack",	"Defense"],
    "Quiet":	["Sp. Attack",	"Speed"],
    "Bashful":	["—",	"—"],
    "Rash":	    ["Sp. Attack",	"Sp. Defense"],
    "Calm":	    ["Sp. Defense",	"Attack"],
    "Gentle":	["Sp. Defense",	"Defense"],
    "Sassy":	["Sp. Defense",	"Speed"],
    "Careful":	["Sp. Defense",	"Sp. Attack"],
    "Quirky":	["—",	"—"]
}

function getNatureMult(nature, stat)
{
    var k = Nature[nature];
    if (!k) {
        console.warn(`No nature named '${nature}' found, using 'Serious' as a default...`);
        k = Nature["Serious"];
    }

    if (stat == k[1]) return 1.1;
    if (stat == k[2]) return 0.9;
    return 1.0;
}

// mon: base stats from table + nature + level
function recalculateActiveStats(mon) {
    const getMul = R.curry(getNatureMult)(mon.nature);
    const g7stat = (base, naturemult) => {
        return ((2 * base + 31 + 63) * mon.level / 100 + 5) * naturemult;
    };
    const stat = (statname) => Math.round(g7stat(mon[statname], getMul(statname)));

    const hp = Math.round((2 * mon.HP + (31 + 63)) * mon.level / 100 + mon.level + 10);
    return R.mergeDeepRight(mon, {
        activeStats: {
            // 31 + 63 = IV + EV / 4
            hp: hp,
            atk: stat("Attack"),
            spAtk: stat("Sp. Attack"),
            def: stat("Defense"),
            spDef: stat("Sp. Defense"),
            speed: stat("Speed")
        },
        current: {
            hp: hp
        }
    });
}

// base is an object with nature, level
// probably name and player
// also the code of the mon to use.
function fillMon(base) {
    const code = base.code;
    const mon = Data.Monsters[code];

    return recalculateActiveStats(R.merge(mon, base));
}

function saveDb(fname, db) {
    let mdb = R.map(R.pick([
         "nature", 
         "level", 
         "name", 
         "player", 
         "code"//, 
         //"current"
        ]), db);
    fs.writeFileSync(fname, JSON.stringify(mdb, null, 4));
}

function loadDb(fname) {
    let buf = fs.readFileSync(fname);
    let obj = JSON.parse(buf);
    return R.map(fillMon, obj);
}

function randomGenerateMon(code, level)
{
    const natureList = [];
    for (var prop in Nature) {
        natureList.push(prop);
    }

    var randomNature = natureList[Math.floor(Math.random()*natureList.length)];
    var monName = Data.Monsters[code]["Species"];
    return fillMon({
        code: code,
        level: level, 
        nature: randomNature,
        name: monName,
        player: ""
    })
}

var getMonByName = R.curry((db, name) => {
    return R.find((it) => it.name == name, db);
})

module.exports = {
    loadDb: loadDb,
    saveDb: saveDb,
    randomGenerateMon: randomGenerateMon,
    getMonByName: getMonByName
}