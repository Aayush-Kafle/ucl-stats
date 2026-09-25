function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getPlayerId() {
  return new URLSearchParams(window.location.search).get('id');
}

function statRow(label, value) {
  return `<div class="stat-row"><span>${label}</span><strong>${value}</strong></div>`;
}

async function init() {
  const status = document.getElementById('status');
  const detail = document.getElementById('player-detail');
  const id = getPlayerId();

  if (!id) {
    status.textContent = 'No player specified.';
    return;
  }

  try {
    const p = await fetchPlayer(id);
    status.remove();
    detail.hidden = false;

    const photo = p.photo
      ? `<img class="player-photo player-photo--large" src="${p.photo}" alt="${p.name}" />`
      : `<div class="player-photo player-photo--large player-photo--placeholder">${initials(p.name)}</div>`;

    const g90 = p.minutes > 0 ? ((p.goals / p.minutes) * 90).toFixed(2) : '0.00';
    const a90 = p.minutes > 0 ? ((p.assists / p.minutes) * 90).toFixed(2) : '0.00';

    detail.innerHTML = `
      <div class="detail-header">
        ${photo}
        <div>
          <h1>${p.name}</h1>
          <div class="player-team">
            <img class="team-crest" src="${p.team.logo}" alt="" />
            <span>${p.team.name}</span>
          </div>
          <div class="detail-meta">${p.position || '—'} &middot; Age ${p.age ?? '—'} &middot; ${p.nationality || '—'}</div>
        </div>
      </div>

      <section class="panel">
        <h2>Stats (2023-24 Champions League)</h2>
        <div class="stat-rows">
          ${statRow('Appearances', p.appearances)}
          ${statRow('Minutes', p.minutes)}
          ${statRow('Goals', p.goals)}
          ${statRow('Assists', p.assists)}
          ${statRow('Goals per 90', g90)}
          ${statRow('Assists per 90', a90)}
          ${statRow('Rating', p.rating ? Number(p.rating).toFixed(1) : '—')}
          ${statRow('Yellow cards', p.yellowCards)}
          ${statRow('Red cards', p.redCards)}
        </div>
      </section>

      <section class="panel">
        <h2>Market value vs. implied value</h2>
        <div id="value-comparison"></div>
        <p class="panel-note">
          Implied value is our own heuristic score, not a real valuation &mdash;
          see <a href="about.html">methodology</a>.
        </p>
      </section>

      <section class="panel">
        <h2>Value score breakdown</h2>
        <div id="value-breakdown"></div>
      </section>
    `;

    renderValueComparison(
      document.getElementById('value-comparison'),
      p.marketValue ? p.marketValue.valueEUR : null,
      p.valuation ? p.valuation.impliedValueEUR : null
    );

    if (p.valuation) {
      // Max possible weighted contribution per factor — differs by position
      // group since defenders/goalkeepers use different weights (see
      // backend/services/valuation.js WEIGHTS).
      const isDefensive = p.valuation.positionGroup === 'DF' || p.valuation.positionGroup === 'GK';
      const maxByFactor = isDefensive
        ? { goals: 5, assists: 5, reliability: 40, age: 31.5, appearances: 20 }
        : { goals: 35, assists: 25, reliability: 15, age: 15.75, appearances: 10 };
      renderBreakdown(document.getElementById('value-breakdown'), p.valuation.breakdown, maxByFactor);
    }
  } catch (err) {
    status.textContent = 'Player not found.';
  }
}

init();
