var checkAnagram = require("./anagram.js")
const R = require("ramda");
const Encounters = require('./pk/cmd.js');

module.exports = (function () {
	var client = null;
	var token = null;
	var cmdtoken = null;

	var commands = {
		"roll": function(param) {
			var reg = /(\d+)d(\d+)/;
			var rec = R.map(parseInt, R.tail(reg.exec(param.trim())));
			if (rec) {
				var cnt = rec[0];
				var dice = rec[1];
				var genRoll = (dice) => Math.floor(Math.random() * (dice) + 1);
				var rolls = R.map(genRoll, R.repeat(cnt, dice));
				var sum = R.sum(rolls);
				
				return { 
					message: "*Roll result*: [" +
							  rolls.toString() + "] sum = " +
							  sum	
				};
			}

			return { error: "Invalid dice (<number>d<number>)" };
		},
		"pk": Encounters.doCmd
	};

	return {
		setDiscordClient: function(cl) {
			client = cl;
		},
		setToken: function(tk) {
			token = tk;
		},
		connect: function() {
			client.login(token)
			.then(()=>{ console.info("Connected") });
		},
		setCommandToken: function(tk) {
			cmdtoken = tk;
		},
		dispatch: function(message) {
			var content = message.content;

			if (content.toLowerCase() == "thanks alessa") {
				message.reply(":)");
				return;
			}

			// not an explicit bot command
			if (content.indexOf(cmdtoken) != 0)
			{
				if (content.indexOf("->") != -1)
				{
					if (message.author.username != client.user.username) {
						checkAnagram(message);
						return;
					}
				}

				if (Encounters.isEncounterActive()) {
					var res = Encounters.matchBattleMessage(message.content);
					if (res && res.message) {
						message.reply(res.message);
						return;
					}
				}

				return;
			}

			// remove token, check format against regex
		  content = content.slice(1);
			var reg = /(\w*)\s+(.*)/;
			var res = reg.exec(content);

			//console.log(res);
			if (res) { // *match*
					if (commands.hasOwnProperty(res[1])) { // command exists
						var msg = commands[res[1]](res[2]);
						if (!msg.error){ // no error
							if (msg.message) // got message
								message.reply(msg.message);
						}
						else
							message.reply("*Error:* " + msg.error);
					} else { // command not found
						message.reply(message, "Unknown command *" + res[1] + "*")
					}
			}
		}
	}
})();
