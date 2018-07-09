const parse = require("csv-parse/lib/sync")
const fs = require("fs");
const R = require("ramda");

function readCSV(filename)
{
    return parse(fs.readFileSync(filename, "utf8"), {});
}

function loadTypeChart() {
    const csvTypeChart = readCSV("data/typechart.csv");
    const tcHeader = csvTypeChart[0];
    // transpose to get [def][atk] instead of the
    // other way around
    const rows = R.tail(csvTypeChart);

    // make the rows floats
    var convertedRows = R.map(R.map(parseFloat), rows);

    // returns typechart[atk][def]
    return R.zipObj(tcHeader, R.map(R.zipObj(tcHeader), convertedRows));
}

function autoparse(d) {
    var o = parseFloat(d);
    if (o) return o;
    else return d;
}

function loadBaseStats() {
    const csvd = readCSV("data/bstat.csv");
    // Remove the code column... leave the # intact
    const header = R.remove(1, 1, csvd[0]);
    // Non-header entries
    const csvBS = R.tail(csvd);
    const codeList = R.map(R.prop(1), csvBS); // get only code list
    
    // remove code column, then convert to float what can be converted
    const monList = R.map(R.map(autoparse), R.map(R.remove(1, 1), csvBS));

    // turn that stat/name list into objects!
    header[0] = "id";
    const monObjects = R.map(R.zipObj(header), monList); 

    // assign { code: mon }
    return R.zipObj(codeList, monObjects);
}

function loadMonTypes() {
    var csv = R.tail(readCSV("data/mtype.csv"));
    var codeList = R.map(R.head, csv);
    return R.zipObj(codeList, R.map(R.tail, csv));
}

function joinStatsToTypes(stats, types) {
    const addTypes = (v) => R.merge(v, 
        { 
            PrimaryType: types[v.id][0], 
            SecondaryType: types[v.id][1] 
        });

    return R.map(addTypes, stats);
}

function loadMoves() {
    var csv = readCSV("data/mlist.csv");
    var header = R.head(csv);
    var data = R.tail(csv);
    var codeList = R.map(R.head, data);
    var zipHeader = R.compose(R.zipObj(R.tail(header)), R.tail, R.map(autoparse));
    return R.zipObj(codeList, R.map(zipHeader, data));
}

function loadMovesByName() {
    var csv = readCSV("data/mlist.csv");
    var header = R.head(csv);
    var data = R.tail(csv);
    var codeList = R.map(R.prop(1), data);
    var zipHeader = R.compose(R.zipObj(R.remove(1, 1, header)), R.remove(1, 1), R.map(autoparse));
    return R.zipObj(codeList, R.map(zipHeader, data));
}

module.exports = {
    TypeChart: loadTypeChart(),
    Monsters: joinStatsToTypes(loadBaseStats(), loadMonTypes()),
    Moves: loadMoves(),
    MovesByName: loadMovesByName()
}