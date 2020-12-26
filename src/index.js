const R = require("ramda");
var Discord = require("discord.js");
var bot = require("./bot.js");

console.info("Acquiring configuration.")
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("config.json", 'utf-8'));

console.info("Creating client.")
// create discord client
var client = new Discord.Client();

console.info("Registering dispatch.");
client.on("message", function(message){
	bot.dispatch(message);
});

bot.setDiscordClient(client);

console.info("Setting token...");
bot.setToken(config.token);
bot.setCommandToken(config.cmdtoken);
if (config.name) bot.setName(config.name);
bot.setAuthorized(config.authorize);
if (config.print) {
	console.info("printing messages...");
	bot.setPrint();
}

console.info("Connecting...");
bot.connect();
