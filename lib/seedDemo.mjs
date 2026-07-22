// One-time demo data: 3 Middleweight amateur fighters with real portrait
// photos (public/demo/<key>.jpg) and a pre-built confirmed bout so the
// Confirmed tab and Points leaderboard aren't empty for a live demo.
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import {
  createFighter,
  setFighterPhoto,
  getFighterById,
  createMatch,
  respondToMatch,
  confirmMatch,
  recordMatchResult,
  supabase,
} from "./db.mjs";
import { createUser, findUserByEmail } from "./auth.mjs";
import { saveFighterPhoto } from "./photo.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoPhotoDir = path.join(__dirname, "..", "public", "demo");

// Division id is resolved by name at seed time (amateur Middle). Three
// fighters, same weight class — two evenly-matched records + one big NSW
// title-holder. Gyms are fake and deliberately NOT on the Central Coast.
const DEMO = [
  { key: "danny", name: "Danny Kerrigan", gym: "Redline Boxing", coach: "Mick Farrell", town: "Penrith", pc: "2750",
    wins: 6, losses: 4, draws: 1, ko: 2, title: null },
  { key: "beau", name: "Beau Sione", gym: "Titan Fight Club", coach: "Joe Vella", town: "Parramatta", pc: "2150",
    wins: 5, losses: 4, draws: 0, ko: 1, title: null },
  { key: "marcus", name: "Marcus Vella", gym: "Steel City Boxing", coach: "Tony Marsh", town: "Newcastle", pc: "2300",
    wins: 18, losses: 2, draws: 1, ko: 11, title: "nsw" },
];

function demoPhotoBuffer(key) {
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    const p = path.join(demoPhotoDir, `${key}.${ext}`);
    if (fs.existsSync(p)) return fs.readFileSync(p);
  }
  return null;
}

async function middleDivisionId() {
  const { data, error } = await supabase
    .from("pf_weight_divisions")
    .select("id")
    .eq("boxer_type", "amateur")
    .eq("name", "Middle")
    .limit(1);
  if (error) throw new Error(error.message);
  return data[0] ? data[0].id : null;
}

export async function seedDemoFighters() {
  const created = [];
  const divId = await middleDivisionId();
  for (const f of DEMO) {
    const email = `demo.${f.key}@prizefighternsw.local`;
    if (await findUserByEmail(email)) {
      created.push({ name: f.name, status: "exists" });
      continue;
    }
    const userId = await createUser(email, "demofighter123");
    const fighterId = await createFighter(userId, {
      full_name: f.name,
      gym_name: f.gym,
      coach_name: f.coach,
      gym_town: f.town,
      gym_postcode: f.pc,
      boxer_type: "amateur",
      weight_division_id: divId,
      wins: f.wins,
      losses: f.losses,
      draws: f.draws,
      exhibition_bouts: 0,
      ko_tko_wins: f.ko,
      has_title: !!f.title,
      title_level: f.title || null,
      title_region: null,
      title_current: !!f.title,
      availability: "open",
    });

    const buf = demoPhotoBuffer(f.key);
    if (buf) {
      const url = await saveFighterPhoto(fighterId, buf);
      await setFighterPhoto(fighterId, url);
    }
    created.push({ name: f.name, status: "created", id: fighterId, photo: buf ? "yes" : "placeholder" });
  }
  return created;
}

// Build one confirmed bout (Danny vs Beau) taken through the full lifecycle —
// offer → both accept → confirm → result recorded — so the Confirmed tab shows a
// matched bout and the Points leaderboard isn't empty. Idempotent.
export async function seedDemoMatch() {
  const { data: dannyRows, error: e1 } = await supabase.from("pf_fighters").select("*").eq("full_name", "Danny Kerrigan").limit(1);
  const { data: beauRows, error: e2 } = await supabase.from("pf_fighters").select("*").eq("full_name", "Beau Sione").limit(1);
  if (e1) throw new Error(e1.message);
  if (e2) throw new Error(e2.message);
  const danny = dannyRows[0];
  const beau = beauRows[0];
  if (!danny || !beau) return { status: "missing-fighters" };

  const { data: existingRows, error: e3 } = await supabase
    .from("pf_matches")
    .select("id")
    .in("status", ["confirmed", "agreed", "proposed"])
    .or(
      `and(fighter_a_id.eq.${danny.id},fighter_b_id.eq.${beau.id}),and(fighter_a_id.eq.${beau.id},fighter_b_id.eq.${danny.id})`
    );
  if (e3) throw new Error(e3.message);
  if (existingRows[0]) return { status: "exists", matchId: existingRows[0].id };

  const matchId = await createMatch({
    fighter_a_id: danny.id,
    fighter_b_id: beau.id,
    event_id: null,
    proposed_by: danny.user_id,
    agreed_weight: "75kg",
    note: "Middleweight matchup — evenly weighted records.",
  });
  await respondToMatch(matchId, danny.id, "accepted");
  await respondToMatch(matchId, beau.id, "accepted");
  await confirmMatch(matchId, null);
  await recordMatchResult({ matchId, winnerFighterId: danny.id, method: "TKO/KO", fotnFighterId: danny.id });
  return { status: "created", matchId };
}
