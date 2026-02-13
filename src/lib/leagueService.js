import { supabase } from "./supabaseClient";
import { generateDraftOrder } from "./generators/generateDraftOrder";
import { generateRoundRobinSchedule } from "./generators/generateRoundRobinSchedule";

function safeEmail(x) {
  return (x || "").toLowerCase().trim();
}

async function hashPin(pin) {
  // Stage 2 simple hashing. Never store raw PIN in DB.
  if (!pin) return null;
  const enc = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toLeagueMemberRole({ isCommissioner, wantsLM }) {
  // IMPORTANT: must match your DB CHECK constraint values
  if (isCommissioner) return "commissioner";
  if (wantsLM) return "verifier";
  return "player";
}

export async function createLeagueWithGeneratedData({
  name,
  commissionerEmail,
  draftMode,
  weeks,
  members,
  // members: [{
  //   display_name,
  //   username,
  //   pin,
  //   email,
  //   wantsLM,        // boolean: user chose “League Manager”
  //   user_id,        // UUID ONLY for real logins (commissioner + selected LMs)
  //   isCommissioner  // boolean
  // }]
}) {
  const commEmail = safeEmail(commissionerEmail);
  if (!commEmail) throw new Error("Missing commissioner email.");
  if (!name?.trim()) throw new Error("Missing league name.");
  if (!weeks || weeks < 1) throw new Error("Weeks must be >= 1.");

  // Get the currently logged-in user (owner of the league)
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const ownerId = userData?.user?.id;
  if (!ownerId) throw new Error("You must be logged in to create a league.");

  // 1) Insert league (owner_id is REQUIRED in your schema)
  const leagueInsert = {
    name: name.trim(),
    owner_id: ownerId,
    weeks,
    draft_mode: draftMode,
    commissioner_email: commEmail,
  };

  const { data: league, error: leagueErr } = await supabase
    .from("leagues")
    .insert(leagueInsert)
    .select()
    .single();

  if (leagueErr) throw leagueErr;

  // 2) Insert league members
  // RULE: Only Commissioner + selected League Managers log in
  // => only those rows should have user_id set. Everyone else user_id = null.
  const memberRows = [];

  for (const m of members) {
    const displayName = (m.display_name || "").trim() || "Member";
    const wantsLM = !!m.wantsLM;

    // Only allow real UUID user_id if this person is actually going to log in.
    // Commissioner ALWAYS logs in.
    // Selected LMs log in (you said commissioner + selected LMs log in).
    const isCommissioner = !!m.isCommissioner;
    const shouldHaveAuthUserId = isCommissioner || wantsLM;

    const row = {
      league_id: league.id,

      // KEY FIX:
      // - if not a login person, store null so we don't hit FK errors.
      user_id: shouldHaveAuthUserId ? (m.user_id || null) : null,

      display_name: displayName,

      // KEY FIX:
      // - match DB constraint: commissioner / verifier / player
      role: toLeagueMemberRole({ isCommissioner, wantsLM }),

      is_league_manager: isCommissioner ? true : wantsLM,
      username: m.username || null,
      pin_hash: m.pin ? await hashPin(m.pin) : null,
    };

    // If they *should* have a user_id (commissioner or LM) but it’s missing,
    // fail loudly so we don’t create broken LMs.
    if (shouldHaveAuthUserId && !row.user_id) {
      throw new Error(
        `Missing user_id for login member "${displayName}". Commissioner + League Managers must be real logged-in users.`
      );
    }

    memberRows.push(row);
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
