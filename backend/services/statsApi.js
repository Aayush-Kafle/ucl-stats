const axios = require('axios');

const BASE_URL = 'https://v3.football.api-sports.io';
const LEAGUE_ID = 2; // UEFA Champions League
const SEASON = 2023; // 2023-24 season — most recent season covered by the free plan (2022-2024)

function client() {
  return axios.create({
    baseURL: BASE_URL,
    headers: { 'x-apisports-key': process.env.FOOTBALL_API_KEY },
  });
}

async function getGroupStageTeams() {
  const res = await client().get('/standings', {
    params: { league: LEAGUE_ID, season: SEASON },
  });
  const groups = res.data.response[0].league.standings;
  return groups.flat().map((entry) => ({
    id: entry.team.id,
    name: entry.team.name,
    logo: entry.team.logo,
    group: entry.group,
  }));
}

async function getPlayersPageForTeam(teamId, page) {
  const res = await client().get('/players', {
    params: { team: teamId, league: LEAGUE_ID, season: SEASON, page },
  });
  return res.data;
}

module.exports = { LEAGUE_ID, SEASON, getGroupStageTeams, getPlayersPageForTeam };
