// One-time demo data: 6 amateur fighters (3 Fly, 3 Middle) with scattered
// records — two similar + one big title-holder per division. Photos are read
// from public/demo/<key>.jpg (real portraits supplied for the demo); if a photo
// isn't present the fighter falls back to the branded placeholder.
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { db } from "./db.mjs";
import { createUser, findUserByEmail } from "./auth.mjs";
import { saveFighterPhoto } from "./photo.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoPhotoDir = path.join(__dirname, "..", "public", "demo");

// Division id: Middle = 9 (amateur). Three fighters, same weight class —
// two evenly-matched records + one big NSW title-holder. Gyms are fake and
// deliberately NOT on the Central Coast.
const DEMO = [
  { key: "danny", name: "Danny Kerrigan", gym: "Redline Boxing", coach: "Mick Farrell", town: "Penrith", pc: "2750",
    div: 9, wins: 6, losses: 4, draws: 1, ko: 2, title: null },
  { key: "beau", name: "Beau Sione", gym: "Titan Fight Club", coach: "Joe Vella", town: "Parramatta", pc: "2150",
    div: 9, wins: 5, losses: 4, draws: 0, ko: 1, title: null },
  { key: "marcus", name: "Marcus Vella", gym: "Steel City Boxing", coach: "Tony Marsh", town: "Newcastle", pc: "2300",
    div: 9, wins: 18, losses: 2, draws: 1, ko: 11, title: "nsw" },
];

// Returns the first existing demo photo buffer for a fighter key, or null.
function demoPhotoBuffer(key) {
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    const p = path.join(demoPhotoDir, `${key}.${ext}`);
    if (fs.existsSync(p)) return fs.readFileSync(p);
  }
  return null;
}

export async function seedDemoFighters() {
  const created = [];
  for (const f of DEMO) {
    const email = `demo.${f.key}@prizefighternsw.local`;
    if (findUserByEmail(email)) {
      created.push({ name: f.name, status: "exists" });
      continue;
    }
    const userId = createUser(email, "demofighter123");
    const info = db.prepare(
      `INSERT INTO fighters (user_id, full_name, gym_name, coach_name, gym_town, gym_postcode,
        boxer_type, weight_division_id, wins, losses, draws, exhibition_bouts, ko_tko_wins,
        has_title, title_level, title_region, title_current, availability)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      userId, f.name, f.gym, f.coach, f.town, f.pc,
      "amateur", f.div, f.wins, f.losses, f.draws, 0, f.ko,
      f.title ? 1 : 0, f.title || null, null, f.title ? 1 : 0, "open"
    );
    const fighterId = Number(info.lastInsertRowid);

    const buf = demoPhotoBuffer(f.key);
    if (buf) {
      const filename = await saveFighterPhoto(fighterId, buf);
      db.prepare("UPDATE fighters SET photo_path=? WHERE id=?").run(filename, fighterId);
    }
    created.push({ name: f.name, status: "created", id: fighterId, photo: buf ? "yes" : "placeholder" });
  }
  return created;
}
