async function fetchPlayers() {
  const res = await fetch('/api/players');
  if (!res.ok) throw new Error('Failed to load players');
  return res.json();
}

async function fetchTeams() {
  const res = await fetch('/api/teams');
  if (!res.ok) throw new Error('Failed to load teams');
  return res.json();
}

async function fetchPlayer(id) {
  const res = await fetch(`/api/players/${id}`);
  if (!res.ok) throw new Error('Player not found');
  return res.json();
}
