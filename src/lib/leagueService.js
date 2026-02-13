// src/lib/leagueService.js
import { supabase } from "./supabaseClient";
import { generateDraftOrder } from "./generators/generateDraftOrder";
import { generateRoundRobinSchedule } from "./generators/generateRoundRobinSchedule";

function safeEmail(x) {
  return (x || "").toLowerCase().trim();
}

async function hashPin(pin) {
  if (!pin) return null;
  const enc = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * IMPORTANT (Stage 2 brick):
 * - Because league_members.user_id FK -> auth.users,
 *   we can only insert members that already have Supabase accounts.
 * - So on creation we insert ONLY the commissioner (current user).
 * - Later brick: "Invite / Join League" for other members.
 */
export async function createLeagueWithGeneratedData({
  name,
  commissionerEmail,
  draftMode,
  weeks,
  members, // we will only use the commissioner member here
}) {
  const commEmail = safeEmail(commissionerEmail);
  if (!commEmail) throw new Error("Missing commissioner email.");
  if (!name?.trim()) throw new Error("Missing league name.");
  if (!weeks || weeks < 1) throw new Error("Weeks must be >= 1.");

  // Need the current logged in user (commissioner)
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  const currentUserId = authData?.user?.id;
  if (!currentUserId) throw new Error("You must be logged in to create a league.");

  // 1) Insert league
  const { data: league, error: leagueErr } = await supabase
    .from("leagues")
    .insert({
      name: name.trim(),
      commissioner_email: commEmail,
      weeks,
      draft_mode: draftMode,
      owner_id: currentUserId, // fixes: null value in owner_id
    })
    .select()
    .single();

  if (leagueErr) throw leagueErr;

  // 2) Insert ONLY commissioner into league_members (FK requires auth user)
  const commissioner =
    members?.find((m) => m.role === "commissioner") || members?.[0] || {};

  const commissionerRow = {
    league_id: league.id,
    user_id: currentUserId,
    display_name: (commissioner.display_name || commissioner.name || "").trim() || "Commissioner",
    // IMPORTANT: your CHECK constraint allows commissioner / verifier / participant (from your screenshot)
    // So we use "commissioner" for commissioner; everyone else later will be "participant"
    role: "commissioner",
    is_league_manager: true,
    username: commissioner.username || null,
    pin_hash: commissioner.pin ? await hashPin(commissioner.pin) : null,
  };

  const { data: insertedMembers, error: membersErr } = await supabase
    .from("league_members")
    .insert([commissionerRow])
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

  // 4) Schedule generation
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

  const { error: schedErr } = await supabase.from("schedule_matchups").insert(scheduleRows);
  if (schedErr) throw schedErr;

  return {
    leagueId: league.id,
    league,
    members: insertedMembers,
  };
}
