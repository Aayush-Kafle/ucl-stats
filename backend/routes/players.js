const express = require('express');
const fs = require('fs');
const path = require('path');
const { findMarketValue } = require('../services/marketValues');
const { computeValuations } = require('../services/valuation');

const router = express.Router();
const SNAPSHOT_PATH = path.join(__dirname, '..', 'data', 'players-snapshot.json');

function loadPlayers() {
  const players = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const valuations = computeValuations(players); // percentiles need the full pool
  return players.map((p) => ({
    ...p,
    marketValue: findMarketValue(p),
    valuation: valuations.get(p.id),
  }));
}

router.get('/', (req, res) => {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    return res.status(503).json({ error: 'Player data not available yet. Run npm run refresh-stats.' });
  }
  res.json(loadPlayers());
});

router.get('/:id', (req, res) => {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    return res.status(503).json({ error: 'Player data not available yet. Run npm run refresh-stats.' });
  }
  const player = loadPlayers().find((p) => String(p.id) === req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  res.json(player);
});

module.exports = router;
