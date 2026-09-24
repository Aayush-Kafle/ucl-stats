const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const SNAPSHOT_PATH = path.join(__dirname, '..', 'data', 'teams-snapshot.json');

router.get('/', (req, res) => {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    return res.status(503).json({ error: 'Teams data not available yet. Run npm run refresh-stats.' });
  }
  const teams = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  res.json(teams);
});

module.exports = router;
