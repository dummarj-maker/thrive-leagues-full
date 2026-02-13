// src/lib/leagueStore.js
const LS_ACTIVE_LEAGUE_ID = "tl_active_league_id";

export function setActiveLeague(leagueId) {
  if (!leagueId) return;
  localStorage.setItem(LS_ACTIVE_LEAGUE_ID, String(leagueId));
}

export function getActiveLeague() {
  return localStorage.getItem(LS_ACTIVE_LEAGUE_ID);
}

export function clearActiveLeague() {
  localStorage.removeItem(LS_ACTIVE_LEAGUE_ID);
}

export function hasActiveLeague() {
  return !!getActiveLeague();
}
