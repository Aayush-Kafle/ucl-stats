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

app.listen(PORT, () => {
  console.log(`UCL Stats server running at http://localhost:${PORT}`);
});
