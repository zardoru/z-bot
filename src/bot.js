var checkAnagram = require("./anagram.js")

module.exports = (function () {
	var client = null;
	var token = null;
	var cmdtoken = null;

	var commands = {
		"roll": function(param) {
			var reg = /(\d+)d(\d+)/;
			var rec = reg.exec(param.trim());
			if (rec) {
				var cnt = parseInt(rec[1]);
				var dice = parseInt(rec[2]);
				var rolls = [];
				var sum = 0;
				for (var i = 0; i < cnt; i++) {
					var roll = Math.floor(Math.random() * (dice) + 1);
					if (roll > dice) roll = dice;

					sum += roll;
					rolls.push(roll);
				}

				return { message: "*Roll result*: [" +
									rolls.toString() + "] sum = " +
									sum	};
			}

			return { error: "Invalid dice (<number>d<number>)" };
		}
	};

	return {
		setDiscordClient: function(cl) {
			client = cl;
		},
		setToken: function(tk) {
			token = tk;
		},
		connect: function() {
			client.login(token);
		},
		setCommandToken: function(tk) {
			cmdtoken = tk;
		},
		dispatch: function(message) {
			var content = message.content;

			if (content == "thanks alessa") {
				message.reply(":)");
				return;
			}

			// not an explicit bot command
			if (content.indexOf(cmdtoken) != 0)
			{
				if (content.indexOf("->") != -1)
				{
					if (message.author != client.user.username)
						checkAnagram(message);
				}
				return;
			}

			// remove token, check format against regex
		  content = content.slice(1);
			var reg = /(\w*)\s+(.*)/;
			var res = reg.exec(content);

			console.log(res);
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
