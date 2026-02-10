// src/lib/permissions.js

const LS_LEAGUE_KEY = "tl_league";

function safeEmail(x) {
  return (x || "").toLowerCase().trim();
}

export function getLocalLeague() {
  try {
    const raw = localStorage.getItem(LS_LEAGUE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function canAccessCommissionerToolsFromLocalLeague(session) {
  const userEmail = safeEmail(session?.user?.email);
  if (!userEmail) return false;

  const league = getLocalLeague();
  if (!league) return false;

  const commissionerEmail = safeEmail(league.commissionerEmail);
  if (commissionerEmail && userEmail === commissionerEmail) return true;

  // LeagueSetup stores members as { name, email, isLeagueManager }
  const members = Array.isArray(league.members) ? league.members : [];
  const asMember = members.find((m) => safeEmail(m.email) === userEmail);

  return !!asMember?.isLeagueManager;
}
