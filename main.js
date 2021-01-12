require('dotenv').config();
const chokidar = require('chokidar');
const W3GReplay = require('w3gjs').default
const Discord = require('discord.js');
const axios = require('axios');

const TOKEN = process.env.TOKEN;
const thebot = new Discord.Client();

const testing = 1;

const replayLocation = "C:\\Users\\azadi\\Documents\\Warcraft III\\BattleNet\\313045227\\Replays\\LastReplay.w3g";
const myName = "azadismind#1665";

let channelId = 0;
if(testing == 1) {
  channelId = "798428548108386305";
} else {
  channelId = "798002085206556695";
}

let myTeam = -1;
let numSessionGames = 0;
let totalSessionDuration = 0;
let longestGame = 0;
let numWins = 0;
let numLosses = 0;
let win = false;

thebot.login(TOKEN);

thebot.on('ready', () => {
  console.log("Discord connected wuuuuuut");
  thebot.channels.cache.get(channelId).send("Starting gaming session.");

  //only triggers for the first game
  chokidar.watch(replayLocation).on('change', replayChanged);
  //only triggers for subsequent games *shrug*
  chokidar.watch(replayLocation).on('unlink', replayChanged);
  if(testing == 1)
    chokidar.watch(replayLocation).on('add', replayChanged);
})

function replayChanged(path, event){
  console.log(event);

  try{
    parseReplay();
  } catch(err){
    console.log(err);
  }
}
//18.261
async function parseReplay(){
  try{
    // parser.on("basic_replay_information", (info) => console.log(info));
    let parser = new W3GReplay();
    const message = new Discord.MessageEmbed();
    let playerNames = "";
    let playerApms = "";
    let playerStats = "";
    let w3statsPromises = [];
    let playerStatsValues = [];
    let teamTotalTime = [ 0, 0 ];
    var counter = 0;

    //Parse replay
    let result = await parser.parse(replayLocation);
    console.log(result);

    //Calculate game time averages
    numSessionGames ++;
    totalSessionDuration += result.duration;
    avgSessionDuration = totalSessionDuration / numSessionGames;
    longestGame = Math.max(result.duration, longestGame);

    //Build a list of promises (to get stats), one for each player
    result.players.forEach((player) => {
        w3statsPromises.push(getProfile(player.name));
    })
    playerStatsValues = await Promise.all(w3statsPromises);
    console.log(playerStatsValues);
    
    result.players.forEach((player) => {
      if(player.name === myName)
        myTeam = player.teamid;

      let currentPlayerStats = playerStatsValues[counter].data.data;
      if(currentPlayerStats !== null){
        let wins = currentPlayerStats.stats.total.wins;
        let losses = currentPlayerStats.stats.total.losses
        playerStats += wins + "-" + losses + " (" + ((wins / (wins + losses))*100).toFixed(2) + "%)\n";
      } else {
        playerStats += "\n";
      }
      
      playerNames += "[" + player.name + "](http://profile.w3booster.com/#" + player.name + ")";
      let playerRace = player.race == 'R' ? player.raceDetected + " (Random)" : player.race;
      playerNames += " " + playerRace + "\n";
      playerApms += player.apm + "\n";
      
      teamTotalTime[player.teamid] += player.currentTimePlayed;
      counter++;
    });

    var winnerTime = Math.max(teamTotalTime[0], teamTotalTime[1])
    if(winnerTime === teamTotalTime[myTeam]){
      win = true;
      message.setTitle('Replay - Win');
      message.setColor('#00FF00');
      numWins ++;
    } else {
      message.setTitle('Replay - Loss');
      message.setColor('#FF0000')
      numLosses ++;
    }

    message.addField('Map', result.map.file);

    message.addFields(
      {name: "Player", value: playerNames, inline: true},
      {name: "APM", value: playerApms, inline: true},
      {name: "Stats", value: playerStats, inline: true},
    );
    message.addFields(
      {name: "Game Length", value: millisToMinutesAndSeconds(result.duration), inline: true},
      {name: "Average", value: millisToMinutesAndSeconds(avgSessionDuration), inline: true},
      {name: "Longest", value: millisToMinutesAndSeconds(longestGame), inline: true},
    );
    
    message.addFields(
      
      {name: "Sesion Time", value: numSessionGames + " games, " + millisToMinutesAndSeconds(totalSessionDuration), inline: true},
      {name: "Session Record", value: numWins + "-" + numLosses, inline: true},
    );
    
    thebot.channels.cache.get(channelId).send(message);

  } catch(err){
    console.log(err);
  }
}

const getProfile = (profile) => {
  const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'PayamAzadi AT Discord Bot (payamazadi@live.com or respond to my Patreon message)'
    }

  try {
      return axios.post('https://profile-be.w3booster.com/userstats', {account:profile}, {
          headers: headers
      });
  } catch(err){
      console.log(err);
  }
};

const millisToMinutesAndSeconds = (millis) => {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  //ES6 interpolated literals/template literals 
  //If seconds is less than 10 put a zero in front.
  return `${minutes}:${(seconds < 10 ? "0" : "")}${seconds}`;
}

// process.on('SIGINT', function() {
//   console.log("Caught interrupt signal");
//   setTimeout(process.exit(), 30000);
// });