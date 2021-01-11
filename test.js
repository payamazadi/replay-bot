require('dotenv').config();
const chokidar = require('chokidar');
const W3GReplay = require('w3gjs').default
const Discord = require('discord.js');
const thebot = new Discord.Client();
const fs = require('fs');
const parser = new W3GReplay();
const TOKEN = process.env.TOKEN;

replayLocation = "C:\\Users\\azadi\\Documents\\Warcraft III\\BattleNet\\313045227\\Replays\\LastReplay.w3g"

thebot.login(TOKEN);

thebot.on('ready', () => {
  console.log("connected");
})

chokidar.watch(replayLocation).on('add', (event, path) => {
  console.log(event);

  try{
    parseReplay();
  }
  catch(err){
    console.log("wtf");
    console.log(err);
  }
});

async function parseReplay(){
  try{
    let result = await parser.parse(replayLocation);

    result.players.forEach((player) => {
      console.log(player.name);
      console.log(player.apm);
      console.log(player.race);
      console.log(player.color);
      console.log(player.teamid);
      console.log("\n");
    })

    // thebot.cache.get('798002085206556695').send('hello');
  }
  catch(err){
    console.log(err);
  }
  
  
}

