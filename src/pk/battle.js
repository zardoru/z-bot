const Data = require("./data.js");
const R = require("ramda");

function calcDamage(atkMon, defMon, move)
{
    const fratio = atkMon.activeStats.atk / defMon.activeStats.def;
    const sratio = atkMon.activeStats.spAtk / defMon.activeStats.spDef;

    if (move.Category == "Status") return 0;

    var stab = 1;
    if (move.Type == atkMon.PrimaryType || move.Type == atkMon.SecondaryType)
        stab = 2;

    const defMul = Data.TypeChart[move.Type];
    var typeEff = defMul[defMon.PrimaryType];
    if (defMon.SecondaryType != "") {
        typeEff *= defMul[defMon.SecondaryType];
    }

    var rand = Math.random() * 0.15 + 0.85;
    const adratio = move.Category == "Physical" ? fratio : sratio;
    const levelboon = (2 * atkMon.level / 5 + 2);
    const modifier = stab * typeEff * rand;
    return Math.round((levelboon * move.Power * adratio / 50 + 2) * modifier);
}

function useMove(atkMon, defMon, move)
{
    const dmg = calcDamage(atkMon, defMon, move);
    defMon.current.hp = R.max(defMon.current.hp - dmg, 0);
    return dmg;
}

function heal(mon) {
    mon.current.hp = mon.activeStats.hp;
}

function Encounter(team1, team2, db) {
    this.team1 = team1;
    this.team2 = team2;
}

Encounter.prototype.getMon = function (name) {
    return this.team1[name] || this.team2[name];
}

module.exports = {
    heal: heal,
    useMove: useMove,
    Encounter: Encounter
}