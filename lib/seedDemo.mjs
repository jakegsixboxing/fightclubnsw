// One-time demo data: 6 amateur fighters (3 Fly, 3 Middle) with scattered
// records — two similar + one big title-holder per division — plus a generated
// portrait avatar for each so the roster and matchmaking look real for a demo.
import sharp from "sharp";
import path from "node:path";
import { db } from "./db.mjs";
import { createUser, findUserByEmail } from "./auth.mjs";
import { uploadsDir } from "./photo.mjs";

// Division ids: Fly = 2, Middle = 9 (amateur, from weight_divisions).
const DEMO = [
  // ---- Flyweight (48-51kg) ----
  { key: "kai", name: "Kai Thompson", gym: "Wyong Boxing", coach: "Ray Dennett", town: "Wyong", pc: "2259",
    div: 2, wins: 4, losses: 3, draws: 0, ko: 1, title: null, c1: "#1f6feb", c2: "#0b2d63" },
  { key: "jesse", name: "Jesse Malu", gym: "Gosford PCYC", coach: "Ana Talia", town: "Gosford", pc: "2250",
    div: 2, wins: 5, losses: 3, draws: 1, ko: 2, title: null, c1: "#2ea043", c2: "#0f3d1e" },
  { key: "tommy", name: "Tommy Fenech", gym: "Central Coast BC", coach: "Sam Reid", town: "Long Jetty", pc: "2261",
    div: 2, wins: 15, losses: 1, draws: 0, ko: 9, title: "nsw", c1: "#c8102e", c2: "#4a0710" },

  // ---- Middleweight (71-75kg) ----
  { key: "danny", name: "Danny Kerrigan", gym: "Newcastle PCYC", coach: "Mick Farrell", town: "Newcastle", pc: "2300",
    div: 9, wins: 6, losses: 4, draws: 1, ko: 2, title: null, c1: "#8957e5", c2: "#2a1a52" },
  { key: "beau", name: "Beau Sione", gym: "Hunter Boxing", coach: "Joe Vella", town: "Maitland", pc: "2320",
    div: 9, wins: 5, losses: 4, draws: 0, ko: 1, title: null, c1: "#d29922", c2: "#4d3608" },
  { key: "marcus", name: "Marcus Vella", gym: "Iron Fist Gym", coach: "Tony Marsh", town: "Wyong", pc: "2259",
    div: 9, wins: 18, losses: 2, draws: 1, ko: 11, title: "nsw", c1: "#c8102e", c2: "#4a0710" },
];

function initials(name) {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// A clean, distinct portrait avatar per fighter: coloured gradient, ring ropes,
// a fighter silhouette, big initials and the surname across the bottom.
async function avatarBuffer(f) {
  const surname = f.name.split(/\s+/).slice(-1)[0].toUpperCase();
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0%" stop-color="${f.c1}"/>
        <stop offset="100%" stop-color="${f.c2}"/>
      </linearGradient>
      <linearGradient id="sil" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#00000055"/>
        <stop offset="100%" stop-color="#00000099"/>
      </linearGradient>
    </defs>
    <rect width="600" height="800" fill="url(#bg)"/>
    <rect x="0" y="66" width="600" height="6" fill="#ffffff" opacity="0.28"/>
    <rect x="0" y="90" width="600" height="6" fill="#ffffff" opacity="0.16"/>
    <g transform="translate(300,430)">
      <circle cx="0" cy="-72" r="92" fill="url(#sil)"/>
      <path d="M -184 240 C -184 70 -104 8 0 8 C 104 8 184 70 184 240 Z" fill="url(#sil)"/>
    </g>
    <text x="300" y="330" text-anchor="middle" font-family="'Arial Black', Arial, sans-serif"
          font-weight="900" font-size="150" fill="#ffffff" opacity="0.92">${escapeXml(initials(f.name))}</text>
    <rect x="0" y="690" width="600" height="70" fill="#000000" opacity="0.5"/>
    <text x="300" y="737" text-anchor="middle" font-family="'Arial Black', Arial, sans-serif"
          font-weight="900" font-size="40" letter-spacing="3" fill="#ffffff">${escapeXml(surname)}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer();
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
    const buf = await avatarBuffer(f);
    const filename = `fighter-${fighterId}.jpg`;
    await sharp(buf).toFile(path.join(uploadsDir, filename));
    db.prepare("UPDATE fighters SET photo_path=? WHERE id=?").run(filename, fighterId);
    created.push({ name: f.name, status: "created", id: fighterId });
  }
  return created;
}
