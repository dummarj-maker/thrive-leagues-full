export function getActiveLeagueId() {
  try {
    const raw = localStorage.getItem("tl_league");
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj?.leagueId || obj?.league_id || obj?.id || null;
  } catch {
    return null;
  }
}

export function setActiveLeague(leagueId) {
  localStorage.setItem("tl_league", JSON.stringify({ leagueId }));
}
