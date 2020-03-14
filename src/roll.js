const R = require("ramda");

module.exports = {
    roll: (param) => {
        var reg = /(\d+)?d(\d+)?(([\+\-\*])(\d+))?/;
        var regresult = reg.exec(param.trim());
        if (regresult) {
            var rec = R.tail(regresult);
            var cnt = rec[0] || 1;
            var dice = rec[1] || 6;
            var genRoll = (dice) => Math.floor(Math.random() * (dice) + 1);
            var rolls = R.map(genRoll, R.repeat(dice, cnt));
            var sum = R.sum(rolls);
            var rollresult = rolls.toString();

            var op = rec[3];
            if (op) {
                var val = parseInt(rec[4]);

                switch (op) {
                    case "+":
                        sum = sum + val; break;
                    case "*":
                        sum = sum * val; break;
                    case "-":
                        sum = sum - val; break;
                }

                return Promise.resolve({
                    message: `**Roll result**: [${rollresult}] ${param.trim()} = ${sum}`
                });
            }

            return Promise.resolve({
                message: `**Roll result**: [${rollresult}] sum = ${sum}`
            });
        }

        return Promise.resolve({ error: "Invalid dice (try <number>?d<number>?([+-*]<number>)?)" });
    }
}