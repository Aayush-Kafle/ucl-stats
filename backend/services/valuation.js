const POSITION_CEILING_EUR = {
  FW: 180_000_000,
  MF: 150_000_000,
  DF: 120_000_000,
  GK: 80_000_000,
};

// FW/MF weights favor goal/assist output. DF/GK have little goal/assist
// expectation, so that weight is redistributed toward reliability, age
// and appearances instead (we don't have defensive-action stats like
// tackles/clean sheets to weight on directly).
const WEIGHTS = {
  attack: { g90: 0.35, a90: 0.25, minutes: 0.15, age: 0.15, appearances: 0.1 },
  defense: { g90: 0.05, a90: 0.05, minutes: 0.4, age: 0.3, appearances: 0.2 },
};

function positionGroup(position) {
  switch ((position || '').toLowerCase()) {
    case 'attacker':
      return 'FW';
    case 'midfielder':
      return 'MF';
    case 'defender':
      return 'DF';
    case 'goalkeeper':
      return 'GK';
    default:
      return 'MF';
  }
}

function ageCurve(age) {
  if (age == null) return 1.0;
  if (age <= 21) return 1.05;
  if (age <= 29) return 1.0;
  if (age <= 32) return 0.9;
  return 0.75;
}

function per90(stat, minutes) {
  return minutes > 0 ? stat / (minutes / 90) : 0;
}

// Percentile rank of `value` within `values` (0-100), ties split evenly.
function percentileRank(values, value) {
  if (values.length <= 1) return 50;
  let below = 0;
  let equal = 0;
  for (const v of values) {
    if (v < value) below += 1;
    else if (v === value) equal += 1;
  }
  return ((below + 0.5 * equal) / values.length) * 100;
}

function computeValuations(players) {
  const groups = {};
  for (const p of players) {
    const group = positionGroup(p.position);
    if (!groups[group]) groups[group] = [];
    groups[group].push({ ...p, group, g90: per90(p.goals, p.minutes), a90: per90(p.assists, p.minutes) });
  }

  const result = new Map();

  for (const [group, groupPlayers] of Object.entries(groups)) {
    const g90Values = groupPlayers.map((p) => p.g90);
    const a90Values = groupPlayers.map((p) => p.a90);
    const appearanceValues = groupPlayers.map((p) => p.appearances);
    const weights = group === 'DF' || group === 'GK' ? WEIGHTS.defense : WEIGHTS.attack;
    const ceiling = POSITION_CEILING_EUR[group] || POSITION_CEILING_EUR.MF;

    for (const p of groupPlayers) {
      const g90Pct = percentileRank(g90Values, p.g90);
      const a90Pct = percentileRank(a90Values, p.a90);
      const appearancesPct = percentileRank(appearanceValues, p.appearances);
      const minutesReliability = Math.min(p.minutes / 900, 1);
      const ageMultiplier = ageCurve(p.age);

      const breakdown = {
        goals: weights.g90 * g90Pct,
        assists: weights.a90 * a90Pct,
        reliability: weights.minutes * minutesReliability * 100,
        age: weights.age * ageMultiplier * 100,
        appearances: weights.appearances * appearancesPct,
      };

      const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
      const impliedValueEUR = Math.round(ceiling * (score / 100) ** 1.8);

      result.set(p.id, {
        positionGroup: group,
        score: Math.round(score * 10) / 10,
        impliedValueEUR,
        breakdown: Object.fromEntries(
          Object.entries(breakdown).map(([k, v]) => [k, Math.round(v * 10) / 10])
        ),
      });
    }
  }

  return result;
}

module.exports = { computeValuations, positionGroup, ageCurve };
