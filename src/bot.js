var checkAnagram = require("./anagram.js")
const Encounters = require('./pk/cmd.js');
const bent = require("bent");
const fs = require("fs");
const R = require("ramda")
const roll = require("./roll.js").roll;

module.exports = (function () {
	var client = null;
	var token = null;
	var cmdtoken = null;
	var authorized = [];
	var name = "z-bot";
	var doPrint = false;
	var sayChan = null;

	var wildmagicTable = [];
	var commands = {};
	
	commands = {
		"roll": roll,
		"pk": Encounters.doCmd,
		// "politics": function(cl) {
		// 	return request({
		// 		uri: "https://api.whatdoestrumpthink.com/api/v1/quotes/random",
		// 		json: true
		// 	})
		// },
		"meow": function(cl) {
			const req = bent('http://aws.random.cat/meow', 'json')
			return req()
				.then((body) => {
					return {
						message: "meow",
						url: body.file
					};
				});
		},
		"what": (cl) => {
			const req = bent('https://randomfox.ca/floof/', 'json')
			return req()
				.then((body) => {
					return {
						message: "fox",
						url: body.image
					}
				})
		},
		"woof": (cl) => {
			const req = bent('https://random.dog/woof.json', 'json')
			return req()
					.then((body) => {
						return {
							message: "woof!",
							url: body.url
						}
					})
		},
		"uwu": function(msg) {
			return Promise.resolve({
				message: R.map(function(x) {
					if (x == "l") return "w"
					if (x == "L") return "W";
					if (x == "r") return "w";
					if (x == "R") return "W";
					return x;
				}, msg.split("")).join("") + " uwu"
			});
		},
		"mud": (msg) => {
			return Promise.resolve({
				message: "kip"
			})
		},
		"wildmagic": (msg) => {
			return Promise.resolve({
				message: wildmagicTable[Math.floor(Math.random() * wildmagicTable.length)]
			});
		},
		"help": (msg) => {
			return Promise.resolve({
				message: R.join(", ", Object.keys(commands))
			})
		},
		"viewchan": async (cnt, msg) => {
			if (authorized.indexOf(msg.author.id) == -1) {
				console.log(`${authorized[0]} , ${msg.channel.id}`);
				return {};
			}

			var msgRet = "";
			client.channels.cache.each((chan, snowflake) => {
				if (chan.type == "text") {
					msgRet += `${chan.guild.name} => ${chan.name}: ${snowflake}\n`;
					if (msgRet.length > 1500) {
						msg.reply(msgRet);
						msgRet = "";
					}
				}
			});

			return {
				message: msgRet
			}
		},
		"saychan": async (cnt, msg) => {
			if (authorized.indexOf(msg.author.id) == -1) {
				console.log(`${authorized[0]} , ${msg.channel.id}`);
				return {};
			}

			sayChan = client.channels.resolve(cnt);
			return {
				message: `resolved to ${sayChan}`
			}
		},
		"s": async (cnt, msg) => {
			if (authorized.indexOf(msg.author.id) == -1) {
				console.log(`${authorized[0]} , ${msg.channel.id}`);
				return {};
			}

			if (!sayChan) {
				return {
					message: "saychan unset"
				}
			}

			sayChan.send(cnt);
			return {};
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
			client.on('ready', () => {
				client.user.setUsername(name);
			});

			console.info("Reading wild magic table");
			var txt = fs.readFileSync("data/wildmagic.csv").toString("utf-8");
			wildmagicTable = txt.split("\n");

			client.login(token)
			.then(()=>{ console.info("Connected") })
			.catch(()=>{ console.error("Couldn't login with provided token: " + token) });
		},
		setCommandToken: function(tk) {
			cmdtoken = tk;
		},
		setAuthorized: function(arr) {
			authorized = arr;
		},
		setName: function(nm) {
			name = nm;
		},
		setPrint: function() {
			doPrint = true;
		},
		dispatch: function(message) {
			var content = message.content;

			if (doPrint) {
				if (message.guild)
					console.log(`[${message.guild.name} #${message.channel.name}:${message.author.username}] ${message.content}`);
				else 
					console.log(`[DM] ${message.author.username}: ${message.content}`);
			}

			if (content.toLowerCase() == "thanks " + name.toLowerCase()) {
				message.reply("::)");
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
					var cmd = res[1].toLowerCase();
					console.info("running command " + cmd);

					if (commands.hasOwnProperty(cmd)) { // command exists
						var prom = commands[cmd](res[2], message);
						
						prom.then((msg) => {
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
						}).catch((msg) => {
							message.reply("*Error:* " + msg);	
						});
						
					} else { // command not found
						var revmsg = content.split("").reverse().join("");
						if (content.length % 2 == 1) // is even... counting cmd token
							revmsg = revmsg.substring(1);
						message.reply(content + revmsg); 
					}
			}
		}
	}
})();
