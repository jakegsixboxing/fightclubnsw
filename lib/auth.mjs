import crypto from "node:crypto";
import { supabase } from "./db.mjs";

const SESSION_DAYS = 30;

async function run(builder) {
  const { data, error } = await builder;
  if (error) throw new Error(error.message || JSON.stringify(error));
  return data;
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = (stored || "").split(":");
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(check, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Comma-separated admin emails. Defaults to the platform owner so event
// creation works out of the box; override with the ADMIN_EMAILS env var.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "jakegsixboxing@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email) {
  return ADMIN_EMAILS.includes((email || "").trim().toLowerCase());
}

export function isAdmin(user) {
  if (!user) return false;
  return user.is_admin === true || isAdminEmail(user.email);
}

export async function createUser(email, password) {
  const existingRows = await run(supabase.from("pf_users").select("id").eq("email", email).limit(1));
  if (existingRows[0]) {
    throw new Error("EMAIL_TAKEN");
  }
  const passwordHash = hashPassword(password);
  const admin = isAdminEmail(email);
  const rows = await run(
    supabase.from("pf_users").insert({ email, password_hash: passwordHash, is_admin: admin }).select("id").limit(1)
  );
  return rows[0].id;
}

export async function findUserByEmail(email) {
  const rows = await run(supabase.from("pf_users").select("*").eq("email", email).limit(1));
  return rows[0] || null;
}

export async function findUserById(id) {
  const rows = await run(supabase.from("pf_users").select("*").eq("id", id).limit(1));
  return rows[0] || null;
}

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await run(supabase.from("pf_sessions").insert({ token, user_id: userId, expires_at: expires.toISOString() }));
  return { token, expires: expires.getTime() };
}

export async function destroySession(token) {
  await run(supabase.from("pf_sessions").delete().eq("token", token));
}

export async function getUserForToken(token) {
  if (!token) return null;
  const rows = await run(supabase.from("pf_sessions").select("user_id, expires_at").eq("token", token).limit(1));
  const session = rows[0];
  if (!session) return null;
  if (new Date(session.expires_at).getTime() <= Date.now()) return null;
  return findUserById(session.user_id);
}

export function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  cookieHeader.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  });
  return out;
}
