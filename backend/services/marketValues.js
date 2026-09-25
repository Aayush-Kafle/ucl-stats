const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'market-values.json');

let cache = null;

function normalize(str) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim();
}

function load() {
  if (!cache) {
    const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    cache = {};
    for (const [teamId, players] of Object.entries(raw)) {
      cache[teamId] = players.map((p) => ({ ...p, normalized: normalize(p.name) }));
    }
  }
  return cache;
}

function findMarketValue(player) {
  const byTeam = load();
  const candidates = byTeam[player.team.id];
  if (!candidates || candidates.length === 0) return null;

  const fullName = normalize(`${player.firstname || ''} ${player.lastname || ''}`.trim());
  const lastNameTokens = normalize(player.lastname || '').split(' ').filter(Boolean);

  // 1. exact full-name match
  let match = candidates.find((c) => c.normalized === fullName);

  // 2. unique match where Transfermarkt's displayed surname (often just the
  // first of two, e.g. Spanish/Portuguese compound surnames) is one of the
  // API's surname tokens ("Zaragoza Martínez" vs TM's "Zaragoza")
  if (!match && lastNameTokens.length > 0) {
    const tokenMatches = candidates.filter((c) => {
      const tmLastToken = c.normalized.split(' ').pop();
      return lastNameTokens.includes(tmLastToken);
    });
    if (tokenMatches.length === 1) match = tokenMatches[0];
  }

  if (!match) return null;
  return { valueEUR: match.valueEUR, valueDisplay: match.valueDisplay };
}

module.exports = { findMarketValue };
