import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { AMATEUR_DIVISIONS, PRO_DIVISIONS } from "./weightDivisions.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "app.db");

export const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS weight_divisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    boxer_type TEXT NOT NULL,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    min_kg REAL,
    max_kg REAL,
    sort_order INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS fighters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    photo_path TEXT,
    gym_name TEXT NOT NULL,
    coach_name TEXT NOT NULL,
    gym_postcode TEXT NOT NULL,
    gym_town TEXT NOT NULL,
    boxer_type TEXT NOT NULL,
    weight_division_id INTEGER,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    draws INTEGER NOT NULL DEFAULT 0,
    exhibition_bouts INTEGER NOT NULL DEFAULT 0,
    ko_tko_wins INTEGER NOT NULL DEFAULT 0,
    has_title INTEGER NOT NULL DEFAULT 0,
    title_level TEXT,
    title_region TEXT,
    title_current INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (weight_division_id) REFERENCES weight_divisions(id)
  );
`);

// Seed weight divisions once.
const countRow = db.prepare("SELECT COUNT(*) AS c FROM weight_divisions").get();
if (countRow.c === 0) {
  const insert = db.prepare(
    "INSERT INTO weight_divisions (boxer_type, name, label, min_kg, max_kg, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
  );
  AMATEUR_DIVISIONS.forEach((d, i) => {
    insert.run("amateur", d.name, d.label, d.minKg, d.maxKg, i);
  });
  PRO_DIVISIONS.forEach((d, i) => {
    insert.run("professional", d.name, d.label, d.minKg, d.maxKg, i);
  });
}

export function getWeightDivisions(boxerType) {
  return db
    .prepare(
      "SELECT * FROM weight_divisions WHERE boxer_type = ? ORDER BY sort_order ASC"
    )
    .all(boxerType);
}

export function getWeightDivisionById(id) {
  return db.prepare("SELECT * FROM weight_divisions WHERE id = ?").get(id);
}
