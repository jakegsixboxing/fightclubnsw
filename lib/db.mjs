// Supabase (Postgres via PostgREST) data layer. All tables/views live in the
// shared Supabase project, prefixed pf_ so they can't collide with any other
// app's tables. Uses @supabase/supabase-js with the service_role key
// (server-side only, bypasses RLS) — no direct Postgres password needed.
import { createClient } from "@supabase/supabase-js";
import { AMATEUR_DIVISIONS, PRO_DIVISIONS } from "./weightDivisions.mjs";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set — the app cannot reach its database.");
}

export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function run(builder) {
  const { data, error } = await builder;
  if (error) throw new Error(error.message || JSON.stringify(error));
  return data;
}

// ---------- Bootstrap ----------
export async function initDb() {
  const { count, error } = await supabase.from("pf_weight_divisions").select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  if (count === 0) {
    const rows = [
      ...AMATEUR_DIVISIONS.map((d, i) => ({
        boxer_type: "amateur", name: d.name, label: d.label, min_kg: d.minKg, max_kg: d.maxKg, sort_order: i,
      })),
      ...PRO_DIVISIONS.map((d, i) => ({
        boxer_type: "professional", name: d.name, label: d.label, min_kg: d.minKg, max_kg: d.maxKg, sort_order: i,
      })),
    ];
    await run(supabase.from("pf_weight_divisions").insert(rows));
    console.log("Seeded weight divisions.");
  }
}

export async function getWeightDivisions(boxerType) {
  return run(supabase.from("pf_weight_divisions").select("*").eq("boxer_type", boxerType).order("sort_order", { ascending: true }));
}

export async function getWeightDivisionById(id) {
  if (id == null) return null;
  const rows = await run(supabase.from("pf_weight_divisions").select("*").eq("id", id).limit(1));
  return rows[0] || null;
}

// ---------- Fighters ----------
export async function getFighterByUserId(userId) {
  const rows = await run(supabase.from("pf_fighters").select("*").eq("user_id", userId).limit(1));
  return rows[0] || null;
}

export async function getFighterById(id) {
  const rows = await run(supabase.from("pf_fighters").select("*").eq("id", id).limit(1));
  return rows[0] || null;
}

export async function createFighter(userId, record) {
  const rows = await run(
    supabase
      .from("pf_fighters")
      .insert({
        user_id: userId,
        full_name: record.full_name,
        gym_name: record.gym_name,
        coach_name: record.coach_name,
        gym_town: record.gym_town,
        gym_postcode: record.gym_postcode,
        boxer_type: record.boxer_type,
        weight_division_id: record.weight_division_id,
        wins: record.wins,
        losses: record.losses,
        draws: record.draws,
        exhibition_bouts: record.exhibition_bouts,
        ko_tko_wins: record.ko_tko_wins,
        has_title: record.has_title,
        title_level: record.title_level,
        title_region: record.title_region,
        title_current: record.title_current,
        availability: record.availability,
      })
      .select("id")
      .limit(1)
  );
  return rows[0].id;
}

export async function updateFighter(fighterId, record) {
  await run(
    supabase
      .from("pf_fighters")
      .update({
        full_name: record.full_name,
        gym_name: record.gym_name,
        coach_name: record.coach_name,
        gym_town: record.gym_town,
        gym_postcode: record.gym_postcode,
        boxer_type: record.boxer_type,
        weight_division_id: record.weight_division_id,
        wins: record.wins,
        losses: record.losses,
        draws: record.draws,
        exhibition_bouts: record.exhibition_bouts,
        ko_tko_wins: record.ko_tko_wins,
        has_title: record.has_title,
        title_level: record.title_level,
        title_region: record.title_region,
        title_current: record.title_current,
        availability: record.availability,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fighterId)
  );
}

export async function setFighterPhoto(fighterId, url) {
  await run(supabase.from("pf_fighters").update({ photo_path: url }).eq("id", fighterId));
}

export async function setAvailability(fighterId, availability) {
  await run(supabase.from("pf_fighters").update({ availability, updated_at: new Date().toISOString() }).eq("id", fighterId));
}

export async function getAllFightersWithDivision() {
  return run(supabase.from("pf_fighters_flat").select("*").order("created_at", { ascending: false }));
}

export async function getFightersForPicker() {
  return run(
    supabase
      .from("pf_fighters_flat")
      .select("id, full_name, gym_name, boxer_type, wins, losses, draws, availability, division_label, division_name, division_type, division_sort")
      .order("division_type", { ascending: true })
      .order("division_sort", { ascending: true })
      .order("full_name", { ascending: true })
  );
}

// ---------- Events ----------
export async function createEvent(e) {
  const rows = await run(
    supabase
      .from("pf_events")
      .insert({
        title: e.title,
        location: e.location,
        venue: e.venue || null,
        event_date: e.event_date,
        event_type: e.event_type,
        description: e.description || null,
        created_by: e.created_by,
      })
      .select("id")
      .limit(1)
  );
  return rows[0].id;
}

export async function setEventPhoto(eventId, url) {
  await run(supabase.from("pf_events").update({ photo_path: url }).eq("id", eventId));
}

export async function getEvents() {
  return run(
    supabase
      .from("pf_events_flat")
      .select("*")
      .order("event_date", { ascending: true })
      .order("created_at", { ascending: false })
  );
}

export async function getEventById(id) {
  const rows = await run(supabase.from("pf_events_flat").select("*").eq("id", id).limit(1));
  return rows[0] || null;
}

// ---------- Nominations ----------
export async function nominate(eventId, fighterId) {
  await run(
    supabase
      .from("pf_nominations")
      .upsert({ event_id: eventId, fighter_id: fighterId }, { onConflict: "event_id,fighter_id", ignoreDuplicates: true })
  );
}

export async function withdrawNomination(eventId, fighterId) {
  await run(supabase.from("pf_nominations").delete().eq("event_id", eventId).eq("fighter_id", fighterId));
}

export async function hasNominated(eventId, fighterId) {
  const { count, error } = await supabase
    .from("pf_nominations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("fighter_id", fighterId);
  if (error) throw new Error(error.message);
  return (count || 0) > 0;
}

export async function getNomineesForEvent(eventId) {
  return run(
    supabase
      .from("pf_nominations_flat")
      .select("*")
      .eq("nom_event_id", eventId)
      .order("division_type", { ascending: true })
      .order("division_sort", { ascending: true })
      .order("full_name", { ascending: true })
  );
}

// Every fighter currently nominated to ANY event (used to build the
// "Matching Pool" — fighters who've put their hand up but aren't matched yet).
export async function getAllNominatedFighterIds() {
  const rows = await run(supabase.from("pf_nominations").select("fighter_id"));
  return new Set(rows.map((r) => r.fighter_id));
}

// ---------- Matches (mutual-agreement matchmaking) ----------
export async function createMatch({ fighter_a_id, fighter_b_id, event_id, proposed_by, agreed_weight, note }) {
  const rows = await run(
    supabase
      .from("pf_matches")
      .insert({
        fighter_a_id,
        fighter_b_id,
        event_id: event_id || null,
        proposed_by: proposed_by || null,
        agreed_weight: agreed_weight || null,
        note: note || null,
      })
      .select("id")
      .limit(1)
  );
  return rows[0].id;
}

export async function getMatchById(id) {
  const rows = await run(supabase.from("pf_matches_flat").select("*").eq("id", id).limit(1));
  return rows[0] || null;
}

export async function getAllMatchesAdmin() {
  const rows = await run(supabase.from("pf_matches_flat").select("*").not("status", "in", "(cancelled,declined)"));
  const order = { agreed: 0, proposed: 1, confirmed: 2 };
  return rows.sort((a, b) => {
    const oa = order[a.status] ?? 3;
    const ob = order[b.status] ?? 3;
    if (oa !== ob) return oa - ob;
    return new Date(b.updated_at) - new Date(a.updated_at);
  });
}

export async function getPendingOffersForFighter(fighterId) {
  const rows = await run(
    supabase
      .from("pf_matches_flat")
      .select("*")
      .eq("status", "proposed")
      .or(`and(fighter_a_id.eq.${fighterId},a_response.eq.pending),and(fighter_b_id.eq.${fighterId},b_response.eq.pending)`)
      .order("created_at", { ascending: false })
  );
  return rows;
}

export async function getBoutsForFighter(fighterId) {
  const rows = await run(
    supabase
      .from("pf_matches_flat")
      .select("*")
      .or(`fighter_a_id.eq.${fighterId},fighter_b_id.eq.${fighterId}`)
      .in("status", ["agreed", "confirmed"])
  );
  return rows.sort((a, b) => {
    if (a.status !== b.status) return a.status === "confirmed" ? 1 : -1;
    return new Date(b.updated_at) - new Date(a.updated_at);
  });
}

export async function getConfirmedMatchesForEvent(eventId) {
  const rows = await run(
    supabase.from("pf_matches_flat").select("*").eq("event_id", eventId).eq("status", "confirmed")
  );
  return rows.sort((a, b) => (a.a_division || "").localeCompare(b.a_division || ""));
}

export async function countPendingOffers(fighterId) {
  const rows = await getPendingOffersForFighter(fighterId);
  return rows.length;
}

export async function respondToMatch(matchId, fighterId, response) {
  const rows = await run(supabase.from("pf_matches").select("*").eq("id", matchId).limit(1));
  const m = rows[0];
  if (!m || m.status !== "proposed") return false;
  const isA = m.fighter_a_id === fighterId;
  const isB = m.fighter_b_id === fighterId;
  if (!isA && !isB) return false;
  const col = isA ? "a_response" : "b_response";
  await run(supabase.from("pf_matches").update({ [col]: response, updated_at: new Date().toISOString() }).eq("id", matchId));

  const updatedRows = await run(supabase.from("pf_matches").select("*").eq("id", matchId).limit(1));
  const updated = updatedRows[0];
  if (updated.a_response === "declined" || updated.b_response === "declined") {
    await run(supabase.from("pf_matches").update({ status: "declined", updated_at: new Date().toISOString() }).eq("id", matchId));
  } else if (updated.a_response === "accepted" && updated.b_response === "accepted") {
    await run(supabase.from("pf_matches").update({ status: "agreed", updated_at: new Date().toISOString() }).eq("id", matchId));
  }
  return true;
}

export async function confirmMatch(matchId, eventId) {
  const rows = await run(supabase.from("pf_matches").select("*").eq("id", matchId).limit(1));
  const m = rows[0];
  if (!m || m.status !== "agreed") return false;
  await run(
    supabase
      .from("pf_matches")
      .update({ status: "confirmed", event_id: eventId || m.event_id || null, updated_at: new Date().toISOString() })
      .eq("id", matchId)
  );
  return true;
}

export async function placeMatchOnEvent(matchId, eventId) {
  await run(supabase.from("pf_matches").update({ event_id: eventId || null, updated_at: new Date().toISOString() }).eq("id", matchId));
}

export async function cancelMatch(matchId) {
  await run(supabase.from("pf_matches").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", matchId));
}

export async function getFighterUserId(fighterId) {
  const rows = await run(supabase.from("pf_fighters").select("user_id").eq("id", fighterId).limit(1));
  return rows[0] ? rows[0].user_id : null;
}

// ---------- Points & results ----------
// Scoring: +1 competed, +2 win, +3 win by TKO/KO (extra), +5 Fighter of the Night.
export function pointsFor({ won, tkoKo, fotn }) {
  let p = 1;
  if (won) p += 2;
  if (won && tkoKo) p += 3;
  if (fotn) p += 5;
  return p;
}

function seasonOf(dateStr) {
  const m = String(dateStr || "").match(/^(\d{4})/);
  return m ? m[1] : "2026";
}

export async function recordMatchResult({ matchId, winnerFighterId, method, fotnFighterId }) {
  const rows = await run(supabase.from("pf_matches").select("*").eq("id", matchId).limit(1));
  const m = rows[0];
  if (!m || m.status !== "confirmed") return false;
  if (m.result_recorded) {
    await run(supabase.from("pf_results").delete().eq("match_id", matchId));
  }
  let eventDate = null;
  if (m.event_id) {
    const evRows = await run(supabase.from("pf_events").select("event_date").eq("id", m.event_id).limit(1));
    eventDate = evRows[0] ? evRows[0].event_date : null;
  }
  const season = seasonOf(eventDate) || "2026";
  const tkoKo = method === "TKO/KO";
  const ids = [m.fighter_a_id, m.fighter_b_id];

  for (const fid of ids) {
    const isWinner = winnerFighterId && fid === winnerFighterId;
    const isDraw = !winnerFighterId;
    const fotn = fotnFighterId && fid === fotnFighterId;
    const outcome = isDraw ? "draw" : isWinner ? "win" : "loss";
    const points = pointsFor({ won: isWinner, tkoKo: isWinner && tkoKo, fotn });
    await run(
      supabase.from("pf_results").insert({
        fighter_id: fid,
        match_id: matchId,
        event_id: m.event_id || null,
        outcome,
        method: method || null,
        fighter_of_night: !!fotn,
        points,
        season,
      })
    );
  }

  await run(
    supabase
      .from("pf_matches")
      .update({
        result_recorded: true,
        winner_fighter_id: winnerFighterId || null,
        method: method || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchId)
  );
  return true;
}

export async function getLeaderboard(season) {
  const s = season || "2026";
  const results = await run(supabase.from("pf_results").select("*").eq("season", s));
  if (!results.length) return [];

  const byFighter = new Map();
  for (const r of results) {
    const agg = byFighter.get(r.fighter_id) || { points: 0, fights: 0, wins_season: 0, fotn_count: 0 };
    agg.points += r.points;
    agg.fights += 1;
    if (r.outcome === "win") agg.wins_season += 1;
    if (r.fighter_of_night) agg.fotn_count += 1;
    byFighter.set(r.fighter_id, agg);
  }
  const fighterIds = [...byFighter.keys()];
  const fighters = await run(supabase.from("pf_fighters_flat").select("*").in("id", fighterIds));
  const byId = new Map(fighters.map((f) => [f.id, f]));

  const rows = fighterIds
    .map((id) => ({ ...byId.get(id), ...byFighter.get(id) }))
    .filter((f) => f.id != null && f.points > 0);

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins_season !== a.wins_season) return b.wins_season - a.wins_season;
    return String(a.full_name).localeCompare(String(b.full_name));
  });
  return rows;
}

export async function getFighterPoints(fighterId, season) {
  const rows = await run(supabase.from("pf_results").select("points").eq("fighter_id", fighterId).eq("season", season || "2026"));
  return { points: rows.reduce((sum, r) => sum + r.points, 0), fights: rows.length };
}

export async function getConfirmedMatchesAll() {
  const rows = await run(supabase.from("pf_matches_flat").select("*").eq("status", "confirmed"));
  return rows.sort((a, b) => {
    const ad = a.event_date ? new Date(a.event_date) : new Date(8640000000000000);
    const bd = b.event_date ? new Date(b.event_date) : new Date(8640000000000000);
    if (ad - bd !== 0) return ad - bd;
    return new Date(b.updated_at) - new Date(a.updated_at);
  });
}

export async function countFighters() {
  const { count, error } = await supabase.from("pf_fighters").select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count || 0;
}

export async function countEvents() {
  const { count, error } = await supabase.from("pf_events").select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count || 0;
}
