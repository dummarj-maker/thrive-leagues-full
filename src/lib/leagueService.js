import { supabase } from "./supabaseClient";
import { generateDraftOrder } from "./generators/generateDraftOrder";
import { generateRoundRobinSchedule } from "./generators/generateRoundRobinSchedule";

function safeEmail(x) {
  return (x || "").toLowerCase().trim();
}

function safeText(x) {
  return (x || "").trim();
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user?.id || null;
}

async function hashPin(pin) {
  // Stage 2 simple hashing. Never store raw pin.
  if (!pin) return null;
  const enc = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Insert into leagues, but gracefully retry if schema doesn't include optional columns.
 * This prevents "Could not find the 'draft_mode' column..." type failures.
 */
async function insertLeagueWithFallback(payload) {
  // Try full payload first
  let attempt = { ...payload };

  for (let i = 0; i < 4; i++) {
    const { data, error } = await supabase
      .from("leagues")
      .insert(attempt)
      .select()
      .single();

    if (!error) return data;

    const msg = String(error.message || "");

    // Supabase "schema cache" style error:
    // "Could not find the 'draft_mode' column of 'leagues' in the schema cache"
    const m1 = msg.match(/Could not find the '([^']+)' column of 'leagues'/);

    // Postgres style error:
    // ERROR: 42703: column "draft_mode" does not exist
    const m2 = msg.match(/column "([^"]+)" does not exist/i);

    const missingCol = (m1 && m1[1]) || (m2 && m2[1]) || null;

    if (missingCol && Object.prototype.hasOwnProperty.call(attempt, missingCol)) {
      // Remove unknown column and retry
      const next = { ...attempt };
      delete next[missingCol];
      attempt = next;
      continue;
    }

    // Anything else = real failure
    throw error;
  }

  throw new Error("Could not insert league (exhausted fallback attempts).");
}

export async function createLeagueWithGeneratedData({
  name,
  commissionerEmail,
  draftMode,
  weeks,
  members, // [{ role, display_name, name, email, username, pin, isLeagueManager/is_league_manager, user_id? }]
}) {
  const leagueName = safeText(name);
  const commEmail = safeEmail(commissionerEmail);
  const w = Number(weeks);

  if (!leagueName) throw new Error("Missing league name.");
  if (!commEmail) throw new Error("Missing commissioner email.");
  if (!Number.isFinite(w) || w < 1) throw new Error("Weeks must be >= 1.");

  const ownerId = await getCurrentUserId();
  if (!ownerId) throw new Error("No logged-in user found. Please log in again.");

  // 1) Insert league (owner_id is REQUIRED in your schema)
  // We include commissioner_email + draft_mode if they exist; fallback removes them if not.
  const league = await insertLeagueWithFallback({
    name: leagueName,
    owner_id: ownerId,
    weeks: w,
    commissioner_email: commEmail,
    draft_mode: (draftMode || "").toLowerCase().trim(),
  });

  // 2) Insert league members
  // DB allows ONLY: commissioner, verifier, player
  // We map League Managers to "verifier" (no is_league_manager column needed).
  const memberRows = [];
  const inputMembers = Array.isArray(members) ? members : [];

  // Ensure commissioner exists even if caller forgot
  const hasCommissioner = inputMembers.some(
    (m) => (m?.role || "").toLowerCase().trim() === "commissioner"
  );

  const normalizedMembers = hasCommissioner
    ? inputMembers
    : [
        {
          role: "commissioner",
          display_name: "Commissioner",
          email: commEmail,
          user_id: ownerId,
          isLeagueManager: true,
        },
        ...inputMembers,
      ];

  for (const m of normalizedMembers) {
    const rawRole = (m?.role || "").toLowerCase().trim();
    const isLM = !!(m?.is_league_manager ?? m?.isLeagueManager);

    // Role mapping to satisfy DB constraint:
    // - commissioner stays commissioner
    // - league managers become verifier
    // - everyone else becomes player
    let role = "player";
    if (rawRole === "commissioner") role = "commissioner";
    else if (rawRole === "verifier") role = "verifier";
    else if (isLM) role = "verifier";

    const displayName =
      safeText(m?.display_name) ||
      safeText(m?.displayName) ||
      safeText(m?.name) ||
      (role === "commissioner" ? "Commissioner" : "Player");

    const username =
      safeText(m?.username) ||
      safeEmail(m?.email) ||
      null;

    // Commissioner must have user_id; others may be null depending on your schema.
    const userId =
      role === "commissioner"
        ? (m?.user_id || m?.userId || ownerId)
        : (m?.user_id || m?.userId || null);

    const pinHash = m?.pin ? await hashPin(m.pin) : null;

    memberRows.push({
      league_id: league.id,
      user_id: userId,
      display_name: displayName,
      role,
      username,
      pin_hash: pinHash,
    });
  }

  const { data: insertedMembers, error: membersErr } = await supabase
    .from("league_members")
    .insert(memberRows)
    .select();

  if (membersErr) {
    // If your DB requires user_id NOT NULL for every member, this will fail.
    // That would mean every person must have an authenticated account BEFORE setup.
    throw membersErr;
  }

  // 3) Generate + persist draft order (never auto-regenerated later)
  const memberIds = insertedMembers.map((m) => m.id);
  const seedString = `${league.id}:${league.created_at || ""}:${commEmail}`;
  const draft = generateDraftOrder(memberIds, { seedString });

  const draftRows = draft.map((d) => ({
    league_id: league.id,
    member_id: d.member_id,
    draft_position: d.draft_position,
  }));

  const { error: draftErr } = await supabase
    .from("draft_order")
    .insert(draftRows);

  if (draftErr) throw draftErr;

  // 4) Generate + persist schedule (round robin for full season; never auto-regenerated later)
  const schedule = generateRoundRobinSchedule(memberIds, w);

  const scheduleRows = schedule.map((s) => ({
    league_id: league.id,
    week: s.week,
    member_a_id: s.member_a_id,
    member_b_id: s.member_b_id,
    partner_a_id: s.partner_a_id,
    partner_b_id: s.partner_b_id,
    is_bye: s.is_bye,
  }));

  const { error: schedErr } = await supabase
    .from("schedule_matchups")
    .insert(scheduleRows);

  if (schedErr) throw schedErr;

  return {
    leagueId: league.id,
    league,
    members: insertedMembers,
  };
}
