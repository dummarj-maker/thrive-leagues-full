// src/lib/leagueService.js
import { supabase } from "./supabaseClient";
import { generateDraftOrder } from "./generators/generateDraftOrder";
import { generateRoundRobinSchedule } from "./generators/generateRoundRobinSchedule";

function safeEmail(x) {
  return (x || "").toLowerCase().trim();
}

function safeText(x) {
  const v = (x || "").trim();
  return v.length ? v : null;
}

async function hashPin(pin) {
  // Stage 2: simple SHA-256 hash (no raw pins in DB)
  if (!pin) return null;
  const enc = new TextEncoder().encode(String(pin));
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * ROLE MAPPING (matches your DB constraint we saw)
 * - commissioner: commissioner
 * - league manager: verifier
 * - regular member: participant
 */
function mapRole({ isCommissioner, isLeagueManager }) {
  if (isCommissioner) return "commissioner";
  if (isLeagueManager) return "verifier";
  return "participant";
}

/**
 * createLeagueWithGeneratedData
 * - Creates league
 * - Creates league_members rows (user_id required ONLY for commissioner + selected LMs)
 * - Generates draft order + schedule ONCE at creation and persists them
 */
export async function createLeagueWithGeneratedData({
  name,
  commissionerEmail,
  draftMode,
  weeks,
  members, // [{ display_name, role, is_league_manager, username, pin, email?, user_id? }]
}) {
  const commEmail = safeEmail(commissionerEmail);
  if (!commEmail) throw new Error("Missing commissioner email.");
  if (!name?.trim()) throw new Error("Missing league name.");
  if (!weeks || weeks < 1) throw new Error("Weeks must be >= 1.");
  if (!Array.isArray(members) || members.length < 3)
    throw new Error("Members list must have at least 3 people.");

  // 1) Insert league
  // NOTE: your DB also has owner_id NOT NULL (you hit that error earlier).
  // We set owner_id automatically by reading auth user id.
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;
  if (!user?.id) throw new Error("You must be logged in to create a league.");

  const { data: league, error: leagueErr } = await supabase
    .from("leagues")
    .insert({
      name: name.trim(),
      owner_id: user.id, // fixes your NOT NULL owner_id error
      commissioner_email: commEmail,
      weeks,
      draft_mode: draftMode,
    })
    .select()
    .single();

  if (leagueErr) throw leagueErr;

  // 2) Insert league members
  // RULE: Commissioner + selected League Managers log in => they have user_id
  // Everyone else can exist with username + pin_hash and null user_id.
  const memberRows = [];
  for (const m of members) {
    const displayName = (m.display_name || "").trim() || "Member";
    const isCommissioner = m.role === "commissioner";
    const wantsLM = !!m.is_league_manager || isCommissioner;

    // Only commissioner + LMs require user_id
    const userId = safeText(m.user_id);
    if (wantsLM && !userId) {
      throw new Error(
        `League Manager "${displayName}" must log in (missing user_id).`
      );
    }

    const role = mapRole({ isCommissioner, isLeagueManager: wantsLM });

    const pinHash = await hashPin(m.pin);

    memberRows.push({
      league_id: league.id,
      user_id: userId, // can be null for non-login members
      display_name: displayName,
      role,
      username: safeText(m.username),
      pin_hash: pinHash,
    });
  }

  const { data: insertedMembers, error: membersErr } = await supabase
    .from("league_members")
    .insert(memberRows)
    .select();

  if (membersErr) throw membersErr;

  // 3) Draft order generation uses league_members.id (UUID PK)
  const memberIds = insertedMembers.map((m) => m.id);
  const seedString = `${league.id}:${league.created_at || ""}:${commEmail}`;
  const draft = generateDraftOrder(memberIds, { seedString });

  const draftRows = draft.map((d) => ({
    league_id: league.id,
    member_id: d.member_id,
    draft_position: d.draft_position,
  }));

  const { error: draftErr } = await supabase.from("draft_order").insert(draftRows);
  if (draftErr) throw draftErr;

  // 4) Schedule generation (persist once)
  const schedule = generateRoundRobinSchedule(memberIds, weeks);

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
