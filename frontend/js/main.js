function normalizeForSearch(str) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function playerCard(player) {
  const card = document.createElement('a');
  card.className = 'player-card';
  card.href = `player.html?id=${player.id}`;

  const photo = player.photo
    ? `<img class="player-photo" src="${player.photo}" alt="${player.name}" loading="lazy" />`
    : `<div class="player-photo player-photo--placeholder">${initials(player.name)}</div>`;

  const valueBadge = player.marketValue
    ? `<div class="value-badge">${player.marketValue.valueDisplay}</div>`
    : '';

  let scoreBadge = '';
  if (player.valuation) {
    let deltaClass = 'score-badge--neutral';
    if (player.marketValue) {
      const delta = player.valuation.impliedValueEUR - player.marketValue.valueEUR;
      deltaClass = delta > 0 ? 'score-badge--under' : 'score-badge--over';
    }
    scoreBadge = `<div class="score-badge ${deltaClass}">Score ${player.valuation.score}</div>`;
  }

  card.innerHTML = `
    ${photo}
    <div class="player-info">
      <div class="player-name">${player.name}</div>
      <div class="player-team">
        <img class="team-crest" src="${player.team.logo}" alt="" />
        <span>${player.team.name}</span>
      </div>
      <div class="player-position">${player.position || '—'}</div>
    </div>
    <div class="badge-row">${valueBadge}${scoreBadge}</div>
    <div class="player-stats">
      <div class="stat"><span class="stat-value">${player.goals}</span><span class="stat-label">G</span></div>
      <div class="stat"><span class="stat-value">${player.assists}</span><span class="stat-label">A</span></div>
      <div class="stat"><span class="stat-value">${player.appearances}</span><span class="stat-label">Apps</span></div>
    </div>
  `;
  return card;
}

const SORTERS = {
  ga: (a, b) => (b.goals + b.assists) - (a.goals + a.assists),
  goals: (a, b) => b.goals - a.goals,
  assists: (a, b) => b.assists - a.assists,
  marketValue: (a, b) => (b.marketValue ? b.marketValue.valueEUR : -1) - (a.marketValue ? a.marketValue.valueEUR : -1),
  score: (a, b) => (b.valuation ? b.valuation.score : -1) - (a.valuation ? a.valuation.score : -1),
  age: (a, b) => (a.age ?? 999) - (b.age ?? 999),
  minutes: (a, b) => b.minutes - a.minutes,
};

let allPlayers = [];

function populateTeamFilter(players) {
  const select = document.getElementById('team-filter');
  const teams = [...new Map(players.map((p) => [p.team.id, p.team.name])).entries()].sort((a, b) =>
    a[1].localeCompare(b[1])
  );
  for (const [id, name] of teams) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  }
}

function applyFiltersAndRender() {
  const grid = document.getElementById('player-grid');
  const emptyState = document.getElementById('empty-state');
  const query = normalizeForSearch(document.getElementById('search-input').value.trim());
  const position = document.getElementById('position-filter').value;
  const team = document.getElementById('team-filter').value;
  const sortKey = document.getElementById('sort-select').value;

  let filtered = allPlayers.filter((p) => {
    if (query && !normalizeForSearch(p.name).includes(query)) return false;
    if (position && p.position !== position) return false;
    if (team && p.team.name !== team) return false;
    return true;
  });

  filtered.sort(SORTERS[sortKey] || SORTERS.ga);

  grid.innerHTML = '';
  emptyState.hidden = filtered.length > 0;
  for (const player of filtered) {
    grid.appendChild(playerCard(player));
  }
}

async function init() {
  const status = document.getElementById('status');
  try {
    allPlayers = await fetchPlayers();
    status.remove();
    populateTeamFilter(allPlayers);

    document.getElementById('search-input').addEventListener('input', applyFiltersAndRender);
    document.getElementById('position-filter').addEventListener('change', applyFiltersAndRender);
    document.getElementById('team-filter').addEventListener('change', applyFiltersAndRender);
    document.getElementById('sort-select').addEventListener('change', applyFiltersAndRender);

    applyFiltersAndRender();
  } catch (err) {
    status.textContent = 'Failed to load players. Is the backend running?';
  }
}

init();
