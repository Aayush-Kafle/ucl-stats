require('dotenv').config();
const path = require('path');
const express = require('express');

const teamsRouter = require('./routes/teams');
const playersRouter = require('./routes/players');

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/api/teams', teamsRouter);
app.use('/api/players', playersRouter);
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`UCL Stats server running at http://localhost:${PORT}`);
});
