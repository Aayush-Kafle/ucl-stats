const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.transfermarkt.com';
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
};
const SEASON = 2023; // matches the 2023-24 stats season

function parseValue(text) {
  const t = text.trim();
  const m = t.match(/€([\d.]+)(m|k)?/i);
  if (!m) return null;
  const num = parseFloat(m[1]);
  if (Number.isNaN(num)) return null;
  if (m[2] && m[2].toLowerCase() === 'm') return Math.round(num * 1_000_000);
  if (m[2] && m[2].toLowerCase() === 'k') return Math.round(num * 1_000);
  return Math.round(num);
}

async function findClub(name) {
  const res = await axios.get(`${BASE_URL}/schnellsuche/ergebnis/schnellsuche`, {
    headers: HEADERS,
    params: { query: name },
  });
  const $ = cheerio.load(res.data);

  // Scope strictly to the "Clubs" results box — links elsewhere on the page
  // (related players, ads, other panels) match the /verein/ pattern too and
  // caused wrong clubs to be picked when we searched the whole page.
  let clubsBox = null;
  $('.box').each((i, box) => {
    const heading = $(box).find('.content-box-headline').first().text();
    if (/clubs|vereine/i.test(heading)) clubsBox = box;
  });
  if (!clubsBox) return null;

  const firstRow = $(clubsBox).find('table.items > tbody > tr').first();
  const link = firstRow.find('td.hauptlink a, a.vereinprofil_tooltip').first();
  const href = link.attr('href');
  const matchedName = link.text().trim();
  if (!href) return null;

  const parts = href.split('/');
  const slug = parts[1];
  const id = parts[parts.length - 1];
  return { slug, id, matchedName };
}

async function getSquadValues(slug, id) {
  const res = await axios.get(`${BASE_URL}/${slug}/kader/verein/${id}/saison_id/${SEASON}`, {
    headers: HEADERS,
  });
  const $ = cheerio.load(res.data);
  const players = [];
  $('table.items > tbody > tr').each((i, el) => {
    const nameCell = $(el).find('td.posrela');
    const name = nameCell.find('td.hauptlink a').first().text().trim();
    const valueText = $(el).find('td.rechts.hauptlink').text().trim();
    if (!name) return;
    players.push({ name, valueEUR: parseValue(valueText), valueDisplay: valueText || null });
  });
  return players;
}

module.exports = { findClub, getSquadValues, parseValue };
