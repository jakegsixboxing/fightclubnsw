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
    is_admin INTEGER NOT NULL DEFAULT 0,
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

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    photo_path TEXT,
    location TEXT NOT NULL,
    venue TEXT,
    event_date TEXT NOT NULL,
    event_type TEXT NOT NULL,
    description TEXT,
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS nominations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    fighter_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (event_id, fighter_id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (fighter_id) REFERENCES fighters(id)
  );
`);

// Backfill is_admin column on pre-existing databases (ignore if it already exists).
try { db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0"); } catch (e) { /* column exists */ }

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

// ---------- Events ----------
export function createEvent(e) {
  const info = db
    .prepare(
      `INSERT INTO events (title, location, venue, event_date, event_type, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(e.title, e.location, e.venue || null, e.event_date, e.event_type, e.description || null, e.created_by);
  return Number(info.lastInsertRowid);
}

export function setEventPhoto(eventId, filename) {
  db.prepare("UPDATE events SET photo_path = ? WHERE id = ?").run(filename, eventId);
}

export function getEvents() {
  return db
    .prepare(
      `SELECT events.*,
              (SELECT COUNT(*) FROM nominations WHERE nominations.event_id = events.id) AS nominee_count
       FROM events
       ORDER BY events.event_date ASC, events.created_at DESC`
    )
    .all();
}

export function getEventById(id) {
  return db.prepare("SELECT * FROM events WHERE id = ?").get(id);
}

// ---------- Nominations ----------
export function nominate(eventId, fighterId) {
  db.prepare(
    "INSERT OR IGNORE INTO nominations (event_id, fighter_id) VALUES (?, ?)"
  ).run(eventId, fighterId);
}

export function withdrawNomination(eventId, fighterId) {
  db.prepare("DELETE FROM nominations WHERE event_id = ? AND fighter_id = ?").run(eventId, fighterId);
}

export function hasNominated(eventId, fighterId) {
  const row = db
    .prepare("SELECT 1 AS x FROM nominations WHERE event_id = ? AND fighter_id = ?")
    .get(eventId, fighterId);
  return !!row;
}

export function getNomineesForEvent(eventId) {
  return db
    .prepare(
      `SELECT fighters.*, weight_divisions.label AS division_label, weight_divisions.boxer_type AS division_type
       FROM nominations
       JOIN fighters ON fighters.id = nominations.fighter_id
       LEFT JOIN weight_divisions ON weight_divisions.id = fighters.weight_division_id
       WHERE nominations.event_id = ?
       ORDER BY weight_divisions.boxer_type ASC, weight_divisions.sort_order ASC, fighters.full_name ASC`
    )
    .all(eventId);
}

// All fighters with their division label, for the profiles-by-division view.
export function getAllFightersWithDivision() {
  return db
    .prepare(
      `SELECT fighters.*, weight_divisions.label AS division_label, weight_divisions.boxer_type AS division_type,
              weight_divisions.name AS division_name, weight_divisions.sort_order AS division_sort
       FROM fighters
       LEFT JOIN weight_divisions ON weight_divisions.id = fighters.weight_division_id
       ORDER BY fighters.created_at DESC`
    )
    .all();
}
