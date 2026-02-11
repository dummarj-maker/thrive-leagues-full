import { supabase } from "./supabaseClient";
import { generateDraftOrder } from "./generators/generateDraftOrder";
import { generateRoundRobinSchedule } from "./generators/generateRoundRobinSchedule";

function safeEmail(x) {
  return (x || "").toLowerCase().trim();
}

function safeText(x) {
  return (x || "").trim();
}

function normalizeRole(role) {
  const r = (role || "").toLowerCase().trim();
  // DB check constraint expects ONLY these two values
  if (r === "commissioner") return "commissioner";
  return "member";
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

export async function createLeagueWithGeneratedData({
  name,
  commissionerEmail,
  draftMode,
  weeks,
  members, // can be mixed: auth user(s) + non-auth placeholder members
}) {
  const commEmail = safeEmail(commissionerEmail);
  const leagueName = safeText(name);

  if (!commEmail) throw new Error("Missing commissioner email.");
  if (!leagueName) throw new Error("Missing league name.");
  if (!weeks || Number(weeks) < 1) throw new Error("Weeks must be >= 1.");

  const normalizedDraftMode = (draftMode || "").toLowerCase().trim();

  // 0) Current logged-in user becomes league owner + commissioner user_id (when available)
  const ownerId = await getCurrentUserId();
  if (!ownerId) throw new Error("No logged-in user found. Please log in again.");

  // 1) Insert league (owner_id is REQUIRED in your schema)
  const { data: league, error: leagueErr } = await supabase
    .from("leagues")
    .insert({
      name: leagueName,
      commissioner_email: commEmail,
      weeks: Number(weeks),
      draft_mode: normalizedDraftMode,
      owner_id: ownerId,
    })
    .select()
    .single();

  if (leagueErr) throw leagueErr;

  // 2) Insert league members
  // IMPORTANT: Your DB enforces role values via check constraint.
  // Also: do NOT require user_id for everyone; only commissioner is guaranteed to be authed.
  const memberRows = [];

  for (const m of members || []) {
    const displayName =
      safeText(m.display_name) ||
      safeText(m.displayName) ||
      safeText(m.name) ||
      "Member";

    const role = normalizeRole(m.role);

    // Commissioner: always tie to ownerId unless explicitly provided
    const userId =
      role === "commissioner"
        ? (m.user_id || m.userId || ownerId)
        : (m.user_id || m.userId || null);

    const username = safeText(m.username) || null;

    // Accept both is_league_manager and isLeagueManager, but ONLY insert if your table has the column.
    // If your league_members table does NOT have is_league_manager, Supabase will error on insert.
    // So we build rows without it by default, and only include it if you confirm the column exists.
    const wantsLM =
      role === "commissioner" ? true : !!(m.is_league_manager ?? m.isLeagueManager);

    const pin = safeText(m.pin) || null;
    const pinHash = pin ? await hashPin(pin) : null;

    // Build base row using ONLY columns we know you have from your screenshot:
    // id, league_id, user_id, display_name, role, username, pin_hash, created_at
    const row = {
      league_id: league.id,
      user_id: userId, // can be null for non-auth members if schema allows
      display_name: displayName,
      role,
      username,
      pin_hash: pinHash,
    };

    // ⚠️ If you HAVE added is_league_manager to league_members, uncomment this line:
    // row.is_league_manager = wantsLM;

    memberRows.push(row);
  }

  // Safety: ensure commissioner row exists
  if (!memberRows.some((r) => r.role === "commissioner")) {
    memberRows.unshift({
      league_id: league.id,
      user_id: ownerId,
      display_name: safeText(members?.[0]?.display_name) || "Commissioner",
      role: "commissioner",
      username: null,
      pin_hash: null,
      // is_league_manager: true, // if/when column exists
    });
  }

  const { data: insertedMembers, error: membersErr } = await supabase
    .from("league_members")
    .insert(memberRows)
    .select();

  if (membersErr) throw membersErr;

  // 3) Draft order generation uses league_members.id (UUID PK)
  const memberIds = insertedMembers.map((x) => x.id);
  const seedString = `${league.id}:${league.created_at || ""}:${commEmail}`;
  const draft = generateDraftOrder(memberIds, { seedString });

  const draftRows = draft.map((d) => ({
    league_id: league.id,
    member_id: d.member_id,
    draft_position: d.draft_position,
  }));

  const { error: draftErr } = await supabase.from("draft_order").insert(draftRows);
  if (draftErr) throw draftErr;

  // 4) Schedule generation
  const schedule = generateRoundRobinSchedule(memberIds, Number(weeks));

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
