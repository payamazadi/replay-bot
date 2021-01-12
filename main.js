require('dotenv').config();
const chokidar = require('chokidar');
const W3GReplay = require('w3gjs').default
const Discord = require('discord.js');

const TOKEN = process.env.TOKEN;
const thebot = new Discord.Client();


replayLocation = "C:\\Users\\azadi\\Documents\\Warcraft III\\BattleNet\\313045227\\Replays\\LastReplay.w3g"

let numSessionGames = 0;
let totalSessionDuration = 0;
let longestGame = 0;

thebot.login(TOKEN);

thebot.on('ready', () => {
  console.log("Discord connected");
  thebot.channels.cache.get('798002085206556695').send("Starting gaming session.");

  //only triggers for the first game
  chokidar.watch(replayLocation).on('change', replayChanged);
  //only triggers for subsequent games *shrug*
  chokidar.watch(replayLocation).on('unlink', replayChanged);
})

function replayChanged(path, event){
  console.log(event);
  console.log(event);
  console.log(event);
  console.log(event);
  console.log(event);
  console.log(event);
  console.log(event);

  try{
    parseReplay();
  }
  catch(err){
    console.log(err);
  }
}
//18.261
async function parseReplay(){
  try{
    // parser.on("basic_replay_information", (info) => console.log(info));
    let parser = new W3GReplay();
    let result = await parser.parse(replayLocation);
    const exampleEmbed = new Discord.MessageEmbed();

    let playerNames = "";
    let playerApms = "";
    let playerRaces = "";

    console.log(result);

    numSessionGames ++;
    totalSessionDuration += result.duration;
    avgSessionDuration = totalSessionDuration / numSessionGames;
    longestGame = Math.max(result.duration, longestGame);

    result.players.forEach((player) => {
      //handle race detected for random
      let race = player.race == 'R' ? player.raceDetected + " (Random)" : player.race;
      playerNames += player.name + " (Red)\n";
      playerApms += player.apm + "\n";
      playerRaces += race + "\n";
      //add to list of player promises
    })

    //await promises.all

    exampleEmbed.addField('Map', result.map.file);

    exampleEmbed.addFields(
      {name: "Player", value: playerNames, inline: true},
      {name: "APM", value: playerApms, inline: true},
      {name: "Race", value: playerRaces, inline: true},
    );
    exampleEmbed.addFields(
      {name: "Game Length", value: millisToMinutesAndSeconds(result.duration), inline: true},
      {name: "Average", value: millisToMinutesAndSeconds(avgSessionDuration), inline: true},
      {name: "Longest", value: millisToMinutesAndSeconds(longestGame), inline: true},
    );
    
    exampleEmbed.addFields(
      {name: "Games", value: numSessionGames, inline: true},
      {name: "Sesion Time", value: millisToMinutesAndSeconds(totalSessionDuration), inline: true},
    );

    exampleEmbed.setColor('#0099ff').setTitle('Replay').setTimestamp();

    thebot.channels.cache.get('798002085206556695').send(exampleEmbed);
  }
  catch(err){
    console.log(err);
  }
}

const millisToMinutesAndSeconds = (millis) => {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  //ES6 interpolated literals/template literals 
  //If seconds is less than 10 put a zero in front.
  return `${minutes}:${(seconds < 10 ? "0" : "")}${seconds}`;
}

process.on('SIGINT', function() {
  thebot.channels.cache.get('798002085206556695').send("Ending gaming session.");
  
  console.log("Caught interrupt signal");
  process.exit();
});