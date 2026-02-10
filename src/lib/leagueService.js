// src/lib/leagueService.js

import { supabase } from "./supabaseClient";
import { generateDraftOrder } from "./generators/generateDraftOrder";
import { generateRoundRobinSchedule } from "./generators/generateRoundRobinSchedule";

function safeEmail(x) {
  return (x || "").toLowerCase().trim();
}

export async function createLeagueWithGeneratedData({
  name,
  commissionerEmail,
  draftMode,
  weeks,
  members, // [{name, email, role, isLeagueManager}]
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

  // 2) Insert members
  const memberRows = members.map((m) => ({
    league_id: league.id,
    email: safeEmail(m.email),
    display_name: (m.name || "").trim() || "Member",
    role: m.role === "commissioner" ? "commissioner" : "member",
    is_league_manager: !!m.isLeagueManager,
  }));

  const { data: insertedMembers, error: membersErr } = await supabase
    .from("league_members")
    .insert(memberRows)
    .select();

  if (membersErr) throw membersErr;

  // Build lookup by email (safe)
  const byEmail = new Map(insertedMembers.map((m) => [safeEmail(m.email), m]));

  // 3) Draft order generation
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

  // 5) No need to initialize standings table (we derive from score_events)
  // Leaderboard starts at 0 because there are no score_events yet.

  return {
    leagueId: league.id,
    league,
    members: insertedMembers,
    byEmail,
  };
}

export async function fetchLeagueMembers(leagueId) {
  const { data, error } = await supabase
    .from("league_members")
    .select("*")
    .eq("league_id", leagueId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchDraftOrder(leagueId) {
  const { data, error } = await supabase
    .from("draft_order")
    .select("draft_position, league_members:member_id(id, display_name, email, role, is_league_manager)")
    .eq("league_id", leagueId)
    .order("draft_position", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchSchedule(leagueId) {
  const { data, error } = await supabase
    .from("schedule_matchups")
    .select("*")
    .eq("league_id", leagueId)
    .order("week", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addScoreEvent({ leagueId, week, memberId, points, note }) {
  const { data, error } = await supabase
    .from("score_events")
    .insert({
      league_id: leagueId,
      week,
      member_id: memberId,
      points,
      note: note || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchLeaderboard(leagueId) {
  // Aggregate in SQL (simple + correct)
  // Note: Supabase JS doesn't have groupBy helper, so use RPC or view later.
  // For Brick 1, we keep this as a raw query using a view you can add later,
  // OR do client aggregation from rows.

  const { data: events, error } = await supabase
    .from("score_events")
    .select("member_id, points")
    .eq("league_id", leagueId);

  if (error) throw error;

  const totals = new Map();
  for (const e of events || []) {
    totals.set(e.member_id, (totals.get(e.member_id) || 0) + (e.points || 0));
  }

  const members = await fetchLeagueMembers(leagueId);

  return members
    .map((m) => ({
      memberId: m.id,
      name: m.display_name,
      email: m.email,
      points: totals.get(m.id) || 0,
    }))
    .sort((a, b) => b.points - a.points);
}
