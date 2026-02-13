// src/lib/leagueStore.js
const KEY = "tl_active_league_id";

export function setActiveLeague(leagueId) {
  if (!leagueId) throw new Error("setActiveLeague: missing leagueId");
  localStorage.setItem(KEY, String(leagueId));
  window.dispatchEvent(new Event("tl_active_league_changed"));
}

export function getActiveLeague() {
  return localStorage.getItem(KEY);
}

export function clearActiveLeague() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("tl_active_league_changed"));
}

/**
 * Small hook-like helper pattern without adding dependencies.
 * Use this inside components if you want reactive updates.
 */
export function subscribeActiveLeague(callback) {
  if (typeof callback !== "function") return () => {};
  const handler = () => callback(getActiveLeague());

  window.addEventListener("storage", handler);
  window.addEventListener("tl_active_league_changed", handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("tl_active_league_changed", handler);
  };
}
