var checkAnagram = require("./anagram.js")
const R = require("ramda");
const Encounters = require('./pk/cmd.js');
const request = require("request-promise");
const cheerio = require("cheerio");

module.exports = (function () {
	var client = null;
	var token = null;
	var cmdtoken = null;

	var commands = {
		"roll": function(param) {
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
		},
		"pk": Encounters.doCmd,
		"politics": function(cl) {
			return request({
				uri: "https://api.whatdoestrumpthink.com/api/v1/quotes/random",
				json: true
			})
		},
		"meow": function(cl) {
			return request("http://random.cat")
				.then((body) => {
					let $ = cheerio.load(body);
					var el = $("#cat");
					// console.info(el);
					var url = el.attr("src");

					// console.info("meow site: " + url);
					return {
						message: "meow",
						url: url
					};
				});
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
			client.login(token)
			.then(()=>{ console.info("Connected") })
			.catch(()=>{ console.error("Couldn't login with provided token: " + token) });
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
			var reg = /(\w*)\s*(.*)/;
			var res = reg.exec(content);

			//console.log(res);
			if (res) { // *match*
					console.info("running command " + res[1]);

					if (commands.hasOwnProperty(res[1])) { // command exists
						var prom = commands[res[1]](res[2]);
						
						prom.then((msg) => {
							if (!msg.error){ // no error
								if (msg.message) // got message
								{
									if (!msg.url)
										message.reply(msg.message);
									else 
									{
										message.reply(msg.message, {
											files: [
												{ attachment: msg.url }
											]});
									}
								}
							}
							else
								message.reply("*Error:* " + msg.error);
						});
						
					} else { // command not found
						message.reply(message, "Unknown command *" + res[1] + "*")
					}
			}
		}
	}
})();
