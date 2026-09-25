function formatEUR(value) {
  if (value == null) return '—';
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}k`;
  return `€${value}`;
}

// A simple two-bar horizontal comparison: market value vs implied value,
// scaled to the larger of the two so both bars are visually comparable.
function renderValueComparison(container, marketValue, impliedValue) {
  const max = Math.max(marketValue || 0, impliedValue || 0, 1);
  const marketPct = ((marketValue || 0) / max) * 100;
  const impliedPct = ((impliedValue || 0) / max) * 100;

  container.innerHTML = `
    <div class="compare-row">
      <div class="compare-label">Market value</div>
      <div class="compare-track"><div class="compare-fill compare-fill--market" style="width:${marketPct}%"></div></div>
      <div class="compare-value">${formatEUR(marketValue)}</div>
    </div>
    <div class="compare-row">
      <div class="compare-label">Implied value</div>
      <div class="compare-track"><div class="compare-fill compare-fill--implied" style="width:${impliedPct}%"></div></div>
      <div class="compare-value">${formatEUR(impliedValue)}</div>
    </div>
  `;
}

// A horizontal bar per breakdown factor, scaled against the max possible
// weighted contribution for that factor (so bars show how "full" each
// factor is, not just its raw point value).
function renderBreakdown(container, breakdown, maxByFactor) {
  const labels = {
    goals: 'Goals (per-90, percentile)',
    assists: 'Assists (per-90, percentile)',
    reliability: 'Minutes reliability',
    age: 'Age curve',
    appearances: 'Appearances (percentile)',
  };

  container.innerHTML = Object.entries(breakdown)
    .map(([key, value]) => {
      const max = maxByFactor[key] || 1;
      const pct = Math.min((value / max) * 100, 100);
      return `
        <div class="breakdown-row">
          <div class="breakdown-label">${labels[key] || key}</div>
          <div class="compare-track"><div class="compare-fill compare-fill--breakdown" style="width:${pct}%"></div></div>
          <div class="compare-value">${value}</div>
        </div>
      `;
    })
    .join('');
}
