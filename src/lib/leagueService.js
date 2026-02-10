import { supabase } from "./supabaseClient";
import { generateDraftOrder } from "./generators/generateDraftOrder";
import { generateRoundRobinSchedule } from "./generators/generateRoundRobinSchedule";

function safeEmail(x) {
  return (x || "").toLowerCase().trim();
}

async function hashPin(pin) {
  // Keep it simple for now (Stage 2). You can upgrade to bcrypt later via Edge Function.
  // Never store raw pin in DB.
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
  members, // [{ user_id, display_name, role, is_league_manager, username, pin, email? }]
}) {
  const commEmail = safeEmail(commissionerEmail);
  if (!commEmail) throw new Error("Missing commissioner email.");
  if (!name?.trim()) throw new Error("Missing league name.");
  if (!weeks || weeks < 1) throw new Error("Weeks must be >= 1.");

  // 1) Insert league
  const { data: league, error: leagueErr } = await supabase
    .from("leagues")
    .insert({
      name: name.trim(),
      commissioner_email: commEmail,
      weeks,
      draft_mode: draftMode,
    })
    .select()
    .single();

  if (leagueErr) throw leagueErr;

  // 2) Insert league members (your table requires user_id)
  const memberRows = [];
  for (const m of members) {
    if (!m.user_id) throw new Error("Every member must have a user_id.");
    memberRows.push({
      league_id: league.id,
      user_id: m.user_id,
      display_name: (m.display_name || "").trim() || "Member",
      role: m.role === "commissioner" ? "commissioner" : "member",
      is_league_manager: !!m.is_league_manager || m.role === "commissioner",
      username: m.username || null,
      pin_hash: m.pin ? await hashPin(m.pin) : null,
      // if your table does NOT have email, remove this line
      // email: m.email ? safeEmail(m.email) : null,
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
