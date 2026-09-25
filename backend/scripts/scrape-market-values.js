const fs = require('fs');
const path = require('path');
const cache = require('../services/cache');
const tm = require('../services/transfermarkt');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DELAY_MS = 2000; // be polite — this is an unofficial scrape, not an API

// Search-query overrides for teams whose API-Football name doesn't match
// Transfermarkt's top search result well.
const SEARCH_OVERRIDES = {
  'Red Bull Salzburg': 'RB Salzburg',
  'FK Crvena Zvezda': 'Red Star Belgrade',
  'BSC Young Boys': 'Young Boys',
  Inter: 'Inter Milan',
  'Paris Saint Germain': 'Paris Saint-Germain',
  'SC Braga': 'Sporting Braga',
  Sevilla: 'Sevilla FC',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchTeamValues(team) {
  const cacheKey = `tm-team-${team.id}`;
  if (cache.has(cacheKey)) {
    console.log(`  [skip] ${team.name} already cached`);
    return cache.read(cacheKey);
  }

  const query = SEARCH_OVERRIDES[team.name] || team.name;
  console.log(`  searching Transfermarkt for "${query}"...`);
  const club = await tm.findClub(query);
  if (!club) {
    console.error(`  NOT FOUND: ${team.name} — skipping, add a SEARCH_OVERRIDES entry`);
    cache.write(cacheKey, { club: null, players: [] });
    return { club: null, players: [] };
  }
  await sleep(DELAY_MS);

  console.log(`  fetching squad for ${team.name} (${club.slug}/${club.id})...`);
  const players = await tm.getSquadValues(club.slug, club.id);
  console.log(`    found ${players.length} players`);

  const result = { club, players };
  cache.write(cacheKey, result);
  return result;
}

async function main() {
  const teams = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'teams-snapshot.json'), 'utf8'));
  const marketValues = {};

  for (const team of teams) {
    try {
      const { players } = await fetchTeamValues(team);
      marketValues[team.id] = players;
      await sleep(DELAY_MS);
    } catch (err) {
      const status = err.response ? err.response.status : null;
      console.error(`  FAILED for ${team.name}: ${status || ''} ${err.message}`);
      console.error('Stopping here — rerun this script later to resume (already-cached teams are skipped).');
      break;
    }
  }

  fs.writeFileSync(
    path.join(DATA_DIR, 'market-values.json'),
    JSON.stringify(marketValues, null, 2)
  );
  const teamCount = Object.keys(marketValues).length;
  const playerCount = Object.values(marketValues).reduce((sum, p) => sum + p.length, 0);
  console.log(`\nWrote market values for ${teamCount} teams, ${playerCount} player entries.`);
}

main().catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
