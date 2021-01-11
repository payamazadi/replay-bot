const W3GReplay = require('w3gjs').default
const Discord = require('discord.js');
const thebot = new Discord.Client();
const fs = require('fs');
const parser = new W3GReplay();


thebot.login("Nzk4MDAyMjAzMjQzMDUzMTA2.X_urdw.8W4hjMdgEyYTX6UfcVtcx-uvS5g");

thebot.on('ready', () => {
  console.log("connected");
})

fs.watch("LastReplay1.w3g", (eventType, filename) => {
  console.log("modified");
  console.log(eventType);
  console.log(filename);
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
    let result = await parser.parse("LastReplay1.w3g");

    result.players.forEach((player) => {
      console.log(player.name);
      console.log(player.apm);
      console.log(player.race);
      console.log(player.color);
      console.log(player.teamid);
      console.log("\n");
    })
  }
  catch(err){
    console.log(err);
  }
  
  
}

