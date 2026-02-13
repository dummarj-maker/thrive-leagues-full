// src/lib/leagueStore.js
// Single source of truth for "which league is active right now".
// Draft/Home/etc should read from here.

const LS_ACTIVE_LEAGUE_KEY = "tl_active_league_id";

const listeners = new Set();

function emit(nextId) {
  for (const fn of listeners) {
    try {
      fn(nextId);
    } catch (e) {
      // swallow listener errors
      console.error("leagueStore listener error:", e);
    }
  }
}

export function getActiveLeagueId() {
  return localStorage.getItem(LS_ACTIVE_LEAGUE_KEY) || "";
}

export function setActiveLeague(leagueId) {
  const id = (leagueId || "").trim();
  if (!id) return;
  localStorage.setItem(LS_ACTIVE_LEAGUE_KEY, id);
  emit(id);
}

export function clearActiveLeague() {
  localStorage.removeItem(LS_ACTIVE_LEAGUE_KEY);
  emit("");
}

export function subscribeActiveLeague(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
