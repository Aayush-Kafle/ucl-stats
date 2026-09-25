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
    ${valueBadge}
    <div class="player-stats">
      <div class="stat"><span class="stat-value">${player.goals}</span><span class="stat-label">G</span></div>
      <div class="stat"><span class="stat-value">${player.assists}</span><span class="stat-label">A</span></div>
      <div class="stat"><span class="stat-value">${player.appearances}</span><span class="stat-label">Apps</span></div>
    </div>
  `;
  return card;
}

async function init() {
  const grid = document.getElementById('player-grid');
  const status = document.getElementById('status');
  try {
    const players = await fetchPlayers();
    status.remove();
    const sorted = [...players].sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists));
    for (const player of sorted) {
      grid.appendChild(playerCard(player));
    }
  } catch (err) {
    status.textContent = 'Failed to load players. Is the backend running?';
  }
}

init();
