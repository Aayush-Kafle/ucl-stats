require('dotenv').config();
const fs = require('fs');
const path = require('path');
const cache = require('../services/cache');
const statsApi = require('../services/statsApi');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DELAY_MS = 8000; // stay safely under the free plan's per-minute rate limit

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function simplifyPlayer(entry, team) {
  const stats = entry.statistics[0] || {};
  return {
    id: entry.player.id,
    name: entry.player.name,
    firstname: entry.player.firstname,
    lastname: entry.player.lastname,
    age: entry.player.age,
    nationality: entry.player.nationality,
    photo: entry.player.photo,
    position: stats.games ? stats.games.position : null,
    team: { id: team.id, name: team.name, logo: team.logo },
    appearances: stats.games ? stats.games.appearences : 0,
    minutes: stats.games ? stats.games.minutes : 0,
    rating: stats.games ? stats.games.rating : null,
    goals: stats.goals ? stats.goals.total : 0,
    assists: stats.goals ? stats.goals.assists : 0,
    yellowCards: stats.cards ? stats.cards.yellow : 0,
    redCards: stats.cards ? stats.cards.red : 0,
  };
}

async function fetchAllPlayersForTeam(team) {
  const cacheKey = `players-team-${team.id}`;
  if (cache.has(cacheKey)) {
    console.log(`  [skip] ${team.name} already cached`);
    return cache.read(cacheKey);
  }

  console.log(`  fetching players for ${team.name}...`);
  let page = 1;
  let totalPages = 1;
  const players = [];

  while (page <= totalPages) {
    const data = await statsApi.getPlayersPageForTeam(team.id, page);
    if (data.response.length === 0) {
      // The free plan silently returns an empty (but 200 OK) response when a
      // burst/throttle limit is hit, instead of a clear error. Treat any
      // empty page as a suspected throttle glitch rather than real data, so
      // we never cache corrupt/partial results.
      throw new Error(`empty response for ${team.name} page ${page} (suspected throttle)`);
    }
    totalPages = data.paging.total;
    for (const entry of data.response) {
      players.push(simplifyPlayer(entry, team));
    }
    console.log(`    page ${page}/${totalPages} -> ${data.response.length} players`);
    page += 1;
    await sleep(DELAY_MS); // always pace requests, including into the next team
  }

  cache.write(cacheKey, players);
  return players;
}

async function main() {
  let teams;
  if (cache.has('teams')) {
    teams = cache.read('teams');
    console.log(`Loaded ${teams.length} teams from cache.`);
  } else {
    console.log('Fetching group-stage teams from /standings...');
    teams = await statsApi.getGroupStageTeams();
    cache.write('teams', teams);
    await sleep(DELAY_MS);
  }

  const allPlayers = [];
  for (const team of teams) {
    try {
      const players = await fetchAllPlayersForTeam(team);
      allPlayers.push(...players);
    } catch (err) {
      const status = err.response ? err.response.status : null;
      console.error(`  FAILED for ${team.name}: ${status} ${err.message}`);
      console.error('Stopping here — rerun this script later to resume (already-cached teams are skipped).');
      break;
    }
  }

  fs.writeFileSync(
    path.join(DATA_DIR, 'teams-snapshot.json'),
    JSON.stringify(teams, null, 2)
  );
  fs.writeFileSync(
    path.join(DATA_DIR, 'players-snapshot.json'),
    JSON.stringify(allPlayers, null, 2)
  );
  console.log(`\nWrote ${teams.length} teams and ${allPlayers.length} players to data/ snapshots.`);
}

main().catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
