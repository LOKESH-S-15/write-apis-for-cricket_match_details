const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

let match = express();
match.use(express.json());

let database = null;
let dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    match.listen(3000, () => {
      console.log("server is running");
      console.log(database);
    });
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};
initializeDbAndServer();

//getting players in the player table
match.get("/players/", async (request, response) => {
  let getPlayers = `SELECT *
    FROM player_details`;
  let playerArray = await database.all(getPlayers);
  response.send(
    playerArray.map((player) => ({
      playerId: player.player_id,
      playerName: player.player_name,
    }))
  );
});

//getting player based on the player ID
match.get("/players/:playerId/", async (request, response) => {
  let { playerId } = request.params;
  let getPlayer = `SELECT *
    FROM player_details
    WHERE
    player_id=${playerId}`;
  let player = await database.get(getPlayer);

  response.send({
    playerId: player.player_id,
    playerName: player.player_name,
  });
});

//Updating the details of a specific player based on the player ID

match.put("/players/:playerId/", async (request, response) => {
  let { playerId } = request.params;
  let { playerName } = request.body;

  let getPlayer = `UPDATE  player_details
   SET player_name="${playerName}"
    WHERE
    player_id=${playerId}`;
  let player = await database.run(getPlayer);

  response.send("Player Details Updated");
});

//getting match details of a specific match
match.get("/matches/:matchId/", async (request, response) => {
  let { matchId } = request.params;
  let getMatch = `SELECT *
    FROM match_details
    WHERE
    match_id=${matchId}`;
  let match = await database.get(getMatch);

  response.send({
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  });
});

//getting list of all the matches of a player
match.get("/players/:playerId/matches", async (request, response) => {
  let { playerId } = request.params;
  let getMatch = `SELECT match_details.match_id as matchId,match,year
    FROM player_match_score inner join match_details on player_match_score.match_id
    = match_details.match_id
    WHERE
    player_id=${playerId}`;

  let matchDetail = await database.all(getMatch);
  console.log(matchDetail);
  response.send(matchDetail);
});

//getting list of players of a specific match
match.get("/matches/:matchId/players", async (request, response) => {
  let { matchId } = request.params;
  let getPlayer = `SELECT
   player_details.player_id as playerId,
   player_name as playerName
    FROM
     player_match_score 
     inner join
      player_details on
       player_match_score.player_id
    = player_details.player_id
    WHERE
    match_id=${matchId}`;

  let player = await database.all(getPlayer);

  response.send(player);
});

//gtting statistics of the total score, fours, sixes of a specific player based on the player ID

match.get("/players/:playerId/playerScores", async (request, response) => {
  let { playerId } = request.params;
  let getMatch = `SELECT 
      player_details.player_id as playerId,
      player_details.player_name as playerName,
      sum(score) as totalScore,
      sum(fours) as totalFours,
      sum(sixes) as totalSixes
    FROM player_match_score
    inner join player_details
    on player_match_score.player_id = player_details.player_id
    WHERE
    player_match_score.player_id = ${playerId}
    GROUP BY 
    player_details.player_id;`;
  console.log(getMatch);
  let matchScores = await database.get(getMatch);
  console.log(matchScores);

  response.send(matchScores);
});

module.exports = match;
