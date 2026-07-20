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
    availability TEXT NOT NULL DEFAULT 'open',
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

  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fighter_a_id INTEGER NOT NULL,
    fighter_b_id INTEGER NOT NULL,
    event_id INTEGER,
    proposed_by INTEGER,
    status TEXT NOT NULL DEFAULT 'proposed',
    a_response TEXT NOT NULL DEFAULT 'pending',
    b_response TEXT NOT NULL DEFAULT 'pending',
    agreed_weight TEXT,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (fighter_a_id) REFERENCES fighters(id),
    FOREIGN KEY (fighter_b_id) REFERENCES fighters(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
  );
`);

// Backfill columns on pre-existing databases (ignore if they already exist).
try { db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0"); } catch (e) { /* exists */ }
try { db.exec("ALTER TABLE fighters ADD COLUMN availability TEXT NOT NULL DEFAULT 'open'"); } catch (e) { /* exists */ }

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

// Lightweight list of fighters for the matchmaking picker.
export function getFightersForPicker() {
  return db
    .prepare(
      `SELECT fighters.id, fighters.full_name, fighters.gym_name, fighters.boxer_type,
              fighters.wins, fighters.losses, fighters.draws, fighters.availability,
              weight_divisions.label AS division_label, weight_divisions.name AS division_name,
              weight_divisions.boxer_type AS division_type, weight_divisions.sort_order AS division_sort
       FROM fighters
       LEFT JOIN weight_divisions ON weight_divisions.id = fighters.weight_division_id
       ORDER BY weight_divisions.boxer_type ASC, weight_divisions.sort_order ASC, fighters.full_name ASC`
    )
    .all();
}

// ---------- Matches (mutual-agreement matchmaking) ----------
export function setAvailability(fighterId, availability) {
  db.prepare("UPDATE fighters SET availability = ?, updated_at = datetime('now') WHERE id = ?").run(availability, fighterId);
}

export function createMatch({ fighter_a_id, fighter_b_id, event_id, proposed_by, agreed_weight, note }) {
  const info = db
    .prepare(
      `INSERT INTO matches (fighter_a_id, fighter_b_id, event_id, proposed_by, agreed_weight, note)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(fighter_a_id, fighter_b_id, event_id || null, proposed_by || null, agreed_weight || null, note || null);
  return Number(info.lastInsertRowid);
}

// One row per match with both fighters' key fields (a_* and b_*) plus event title.
const MATCH_SELECT = `
  SELECT m.*,
         fa.full_name AS a_name, fa.gym_name AS a_gym, fa.wins AS a_wins, fa.losses AS a_losses, fa.draws AS a_draws, fa.user_id AS a_user_id,
         da.label AS a_division, fa.boxer_type AS a_type,
         fb.full_name AS b_name, fb.gym_name AS b_gym, fb.wins AS b_wins, fb.losses AS b_losses, fb.draws AS b_draws, fb.user_id AS b_user_id,
         db_.label AS b_division, fb.boxer_type AS b_type,
         ev.title AS event_title, ev.event_date AS event_date
  FROM matches m
  JOIN fighters fa ON fa.id = m.fighter_a_id
  JOIN fighters fb ON fb.id = m.fighter_b_id
  LEFT JOIN weight_divisions da ON da.id = fa.weight_division_id
  LEFT JOIN weight_divisions db_ ON db_.id = fb.weight_division_id
  LEFT JOIN events ev ON ev.id = m.event_id
`;

export function getMatchById(id) {
  return db.prepare(`${MATCH_SELECT} WHERE m.id = ?`).get(id);
}

export function getAllMatchesAdmin() {
  return db
    .prepare(
      `${MATCH_SELECT} WHERE m.status != 'cancelled' AND m.status != 'declined'
       ORDER BY CASE m.status WHEN 'agreed' THEN 0 WHEN 'proposed' THEN 1 WHEN 'confirmed' THEN 2 ELSE 3 END, m.updated_at DESC`
    )
    .all();
}

// Pending offers for a fighter (their side still 'pending', still in 'proposed').
export function getPendingOffersForFighter(fighterId) {
  return db
    .prepare(
      `${MATCH_SELECT}
       WHERE m.status = 'proposed'
         AND ((m.fighter_a_id = ? AND m.a_response = 'pending') OR (m.fighter_b_id = ? AND m.b_response = 'pending'))
       ORDER BY m.created_at DESC`
    )
    .all(fighterId, fighterId);
}

// Agreed + confirmed bouts involving this fighter (for their profile).
export function getBoutsForFighter(fighterId) {
  return db
    .prepare(
      `${MATCH_SELECT}
       WHERE (m.fighter_a_id = ? OR m.fighter_b_id = ?) AND m.status IN ('agreed','confirmed')
       ORDER BY m.status DESC, m.updated_at DESC`
    )
    .all(fighterId, fighterId);
}

export function getConfirmedMatchesForEvent(eventId) {
  return db
    .prepare(`${MATCH_SELECT} WHERE m.event_id = ? AND m.status = 'confirmed' ORDER BY da.boxer_type, da.sort_order`)
    .all(eventId);
}

export function countPendingOffers(fighterId) {
  const r = db
    .prepare(
      `SELECT COUNT(*) AS c FROM matches
       WHERE status = 'proposed'
         AND ((fighter_a_id = ? AND a_response = 'pending') OR (fighter_b_id = ? AND b_response = 'pending'))`
    )
    .get(fighterId, fighterId);
  return r.c;
}

// A fighter accepts/declines their side. Recomputes status.
export function respondToMatch(matchId, fighterId, response) {
  const m = db.prepare("SELECT * FROM matches WHERE id = ?").get(matchId);
  if (!m || m.status !== "proposed") return false;
  const isA = m.fighter_a_id === fighterId;
  const isB = m.fighter_b_id === fighterId;
  if (!isA && !isB) return false;
  const col = isA ? "a_response" : "b_response";
  db.prepare(`UPDATE matches SET ${col} = ?, updated_at = datetime('now') WHERE id = ?`).run(response, matchId);

  const updated = db.prepare("SELECT * FROM matches WHERE id = ?").get(matchId);
  if (updated.a_response === "declined" || updated.b_response === "declined") {
    db.prepare("UPDATE matches SET status = 'declined', updated_at = datetime('now') WHERE id = ?").run(matchId);
  } else if (updated.a_response === "accepted" && updated.b_response === "accepted") {
    db.prepare("UPDATE matches SET status = 'agreed', updated_at = datetime('now') WHERE id = ?").run(matchId);
  }
  return true;
}

// Admin confirms an agreed match, optionally placing it on an event card.
export function confirmMatch(matchId, eventId) {
  const m = db.prepare("SELECT * FROM matches WHERE id = ?").get(matchId);
  if (!m || m.status !== "agreed") return false;
  db.prepare("UPDATE matches SET status = 'confirmed', event_id = ?, updated_at = datetime('now') WHERE id = ?").run(eventId || m.event_id || null, matchId);
  return true;
}

export function placeMatchOnEvent(matchId, eventId) {
  db.prepare("UPDATE matches SET event_id = ?, updated_at = datetime('now') WHERE id = ?").run(eventId || null, matchId);
}

export function cancelMatch(matchId) {
  db.prepare("UPDATE matches SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(matchId);
}

export function getFighterUserId(fighterId) {
  const r = db.prepare("SELECT user_id FROM fighters WHERE id = ?").get(fighterId);
  return r ? r.user_id : null;
}
