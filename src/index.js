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

console.info("Logging into " + config.email)
bot.setDiscordClient(client);
bot.setToken(config.token);
client.login(config.email, config.password);
