// src/lib/leagueStore.js
// Single source of truth for "which league is active" in this browser.

const LS_ACTIVE_LEAGUE_ID = "tl_active_league_id";

export function setActiveLeague(leagueId) {
  if (!leagueId) throw new Error("setActiveLeague requires a leagueId.");
  localStorage.setItem(LS_ACTIVE_LEAGUE_ID, String(leagueId));
}

export function getActiveLeagueId() {
  return localStorage.getItem(LS_ACTIVE_LEAGUE_ID);
}

export function clearActiveLeague() {
  localStorage.removeItem(LS_ACTIVE_LEAGUE_ID);
}
