const R = require("ramda");

function alphaFilter(a) {
    return /^[A-Z]$/i.test(a);
}

function anagramize(s) {
    return s.toLowerCase().split("").filter(alphaFilter).sort().join("");
}

var charcounter = R.countBy(R.identity);

function chardifference(a, b) {
    var ret = {};
    
    // chars in a, be it or not in b
    for (var k in a) {
        if (b[k]) {
            ret[k] = b[k] - a[k];
        } else {
            ret[k] = -a[k];
        }
    }

    // chars in b, but not in a
    for (var k in b) {
        if (!a[k]) {
            ret[k] = b[k];
        }
    }

    return ret;
}

var filterzeroes = R.filter((it) => it != 0);

function checkAnagram(msg) {
    let c = msg.content.split("->");
    c[0] = anagramize(c[0]);
    c[1] = anagramize(c[1]);

    var countLeft = charcounter(c[0]);
    var countRight = charcounter(c[1]);

    var diff = filterzeroes(chardifference(countLeft, countRight));
    var replyarr = [];
    for (var k in diff) {
        var v = diff[k];

        var cmsg;
        if (v > 0)
            cmsg = "extra";
        else
            cmsg = "missing";

        v = Math.abs(v);
        replyarr.push(`${k}: ${v} ${cmsg}`);
    }

    var replyarrstr = replyarr.join("\n");
    var anag = msg.content;
    if (replyarr.length) {
        var out = `The anagram "${anag}" is not valid: differences are:
${replyarrstr}`;
        msg.reply(out);
    } else {
        msg.reply(`The anagram "${anag}" is valid!`);
    }
}

module.exports = checkAnagram;