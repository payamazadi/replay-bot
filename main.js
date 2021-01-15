require('dotenv').config();
const chokidar = require('chokidar');
const W3GReplay = require('w3gjs').default
const Discord = require('discord.js');
const axios = require('axios');

const thebot = new Discord.Client();

const TOKEN = process.env.TOKEN;
const REPLAYLOCATION = process.env.REPLAYLOCATION;
const PLAYERNAME = process.env.PLAYERNAME;

const testing = 0;

let channelId = 0;
if(testing == 1) {
  channelId = process.env.TESTINGCHANNELID;
} else {
  channelId = process.env.REALCHANNELID;
}

let myTeam = -1;
let numSessionGames = 0;
let totalSessionDuration = 0;
let longestGame = 0;
let numWins = 0;
let numLosses = 0;

thebot.login(TOKEN);

thebot.on('ready', () => {
  console.log("Discord connected");
  thebot.channels.cache.get(channelId).send("Starting gaming session.");

  //only triggers for the first game
  chokidar.watch(REPLAYLOCATION).on('change', replayChanged);
  //only triggers for subsequent games *shrug*
  chokidar.watch(REPLAYLOCATION).on('unlink', replayChanged);
  if(testing == 1)
    chokidar.watch(REPLAYLOCATION).on('add', replayChanged);
})

function replayChanged(path, event){
  if(testing === 1) console.log(event);

  try{
    parseReplay();
  } catch(err){
    console.log("Error parsing replay");
    console.log(err);
  }
}
//18.261
async function parseReplay(){
  try{
    // parser.on("basic_replay_information", (info) => console.log(info));
    let parser = new W3GReplay();
    const message = new Discord.MessageEmbed();
    let statsRequestFailed = false;
    let playerNames = "";
    let playerApms = "";
    let playerStats = "";
    let w3statsPromises = [];
    let playerStatsValues = [];
    let teamTotalTime = [ 0, 0 ];
    var counter = 0;

    //Parse replay
    let result = await parser.parse(REPLAYLOCATION);
    if(testing === 1) console.log(result);

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
    statsRequestFailed = playerStatsValues === null;
    
    result.players.forEach((player) => {
      if(player.name === PLAYERNAME)
        myTeam = player.teamid;

      if(!statsRequestFailed){
        let currentPlayerStats = playerStatsValues[counter].data.data;
        if(currentPlayerStats !== null){
          let wins = currentPlayerStats.stats.total.wins;
          let losses = currentPlayerStats.stats.total.losses
          playerStats += wins + "-" + losses + " (" + ((wins / (wins + losses))*100).toFixed(2) + "%)\n";
        }
      } else {
        playerStats += "(Failed)\n";
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
    console.log("Error in body of parseReplay (message sending etc)");
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
      if(err.response != 200)
        console.log("Error getting results from profile.w3booster.com, HTTP status !== 200")
        console.log(err);
        return null;
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