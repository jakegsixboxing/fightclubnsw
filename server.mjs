import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import {
  db,
  getWeightDivisions,
  getWeightDivisionById,
  createEvent,
  setEventPhoto,
  getEvents,
  getEventById,
  nominate,
  withdrawNomination,
  hasNominated,
  getNomineesForEvent,
  getAllFightersWithDivision,
  getFightersForPicker,
  setAvailability,
  createMatch,
  getMatchById,
  getAllMatchesAdmin,
  getPendingOffersForFighter,
  getBoutsForFighter,
  getConfirmedMatchesForEvent,
  respondToMatch,
  confirmMatch,
  placeMatchOnEvent,
  cancelMatch,
} from "./lib/db.mjs";
import {
  createUser,
  findUserByEmail,
  createSession,
  destroySession,
  getUserForToken,
  verifyPassword,
  parseCookies,
  isAdmin,
} from "./lib/auth.mjs";
import { readBody, getBoundary, parseMultipart } from "./lib/multipart.mjs";
import {
  saveFighterPhoto,
  renderFighterPhoto,
  saveEventPhoto,
  renderEventPhoto,
  isAllowedPhotoType,
  photoExists,
  uploadsDir,
} from "./lib/photo.mjs";
import { layout } from "./lib/layout.mjs";
import { buildBio } from "./lib/bio.mjs";
import { titleOverlayText } from "./lib/titles.mjs";
import {
  homePage,
  signupPage,
  loginPage,
  registerPage,
  fighterProfilePage,
  dashboardPage,
  fighterProfilesPage,
  eventsListPage,
  eventDetailPage,
  eventFormPage,
  matchmakingPage,
} from "./lib/pages.mjs";

const EVENT_TYPES = ["Amateur", "Pro-Am", "Professional"];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === "production";

const CONTENT_TYPES = {
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/manifest+json",
};

function sendHtml(res, status, html) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

function sendRedirect(res, location, cookie) {
  const headers = { Location: location };
  if (cookie) headers["Set-Cookie"] = cookie;
  res.writeHead(302, headers);
  res.end();
}

function sessionCookie(token, expires) {
  const parts = [
    `session=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Expires=${new Date(expires).toUTCString()}`,
  ];
  if (IS_PROD) parts.push("Secure");
  return parts.join("; ");
}

function clearSessionCookie() {
  const parts = ["session=", "HttpOnly", "Path=/", "SameSite=Lax", "Max-Age=0"];
  if (IS_PROD) parts.push("Secure");
  return parts.join("; ");
}

function getFighterByUserId(userId) {
  return db.prepare("SELECT * FROM fighters WHERE user_id = ?").get(userId);
}

function getFighterById(id) {
  return db.prepare("SELECT * FROM fighters WHERE id = ?").get(id);
}

function weightDivisionsByTypeJson() {
  return {
    amateur: getWeightDivisions("amateur").map((d) => ({ id: d.id, label: d.label })),
    professional: getWeightDivisions("professional").map((d) => ({ id: d.id, label: d.label })),
  };
}

async function serveStatic(req, res, urlPath) {
  const rel = urlPath.replace(/^\/public\//, "");
  const filePath = path.join(publicDir, rel);
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    });
    res.end(data);
  });
}

function validateRegistrationFields(fields) {
  const required = [
    "full_name",
    "gym_name",
    "coach_name",
    "gym_town",
    "gym_postcode",
    "boxer_type",
    "weight_division_id",
    "has_title",
  ];
  for (const key of required) {
    if (!fields[key] || String(fields[key]).trim() === "") {
      return `Please fill in the "${key.replace(/_/g, " ")}" field.`;
    }
  }
  if (!/^\d{4}$/.test(fields.gym_postcode)) {
    return "Gym postcode must be a 4-digit number.";
  }
  if (!["amateur", "professional"].includes(fields.boxer_type)) {
    return "Invalid boxer type.";
  }
  if (fields.has_title === "yes") {
    if (!["regional", "nsw", "australian"].includes(fields.title_level || "")) {
      return "Please select your title level.";
    }
    if (!["current", "former"].includes(fields.title_current || "")) {
      return "Please tell us if you are a current or former title holder.";
    }
  }
  const division = getWeightDivisionById(Number(fields.weight_division_id));
  if (!division || division.boxer_type !== fields.boxer_type) {
    return "Please select a weight division that matches whether you are amateur or professional.";
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const cookies = parseCookies(req.headers.cookie);
    const user = getUserForToken(cookies.session);

    // Static assets
    if (pathname.startsWith("/public/")) {
      return serveStatic(req, res, pathname);
    }

    // Uploaded / rendered fighter photos
    const photoMatch = pathname.match(/^\/photo\/(\d+)$/);
    if (photoMatch && req.method === "GET") {
      const fighter = getFighterById(Number(photoMatch[1]));
      if (!fighter || !fighter.photo_path || !photoExists(fighter.photo_path)) {
        const placeholder = path.join(publicDir, "favicon.svg");
        const data = fs.readFileSync(placeholder);
        res.writeHead(200, { "Content-Type": "image/svg+xml" });
        res.end(data);
        return;
      }
      const overlay = titleOverlayText(fighter);
      const buf = await renderFighterPhoto(fighter.photo_path, overlay);
      res.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=300" });
      res.end(buf);
      return;
    }

    // Event banner photos
    const eventPhotoMatch = pathname.match(/^\/event-photo\/(\d+)$/);
    if (eventPhotoMatch && req.method === "GET") {
      const event = getEventById(Number(eventPhotoMatch[1]));
      if (!event || !event.photo_path || !photoExists(event.photo_path)) {
        const placeholder = path.join(publicDir, "logo-master.png");
        const data = fs.readFileSync(placeholder);
        res.writeHead(200, { "Content-Type": "image/png" });
        res.end(data);
        return;
      }
      const buf = await renderEventPhoto(event.photo_path);
      res.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=300" });
      res.end(buf);
      return;
    }

    const admin = isAdmin(user);

    // ---------- GET routes ----------
    if (req.method === "GET" && pathname === "/") {
      // Public landing when logged out; members hub when logged in.
      if (!user) {
        return sendHtml(res, 200, layout({ title: "Home", user, body: homePage(), active: "home" }));
      }
      const fighter = getFighterByUserId(user.id);
      if (!fighter) return sendRedirect(res, "/register");
      const fighterCount = db.prepare("SELECT COUNT(*) AS c FROM fighters").get().c;
      const eventCount = db.prepare("SELECT COUNT(*) AS c FROM events").get().c;
      const pendingOffers = getPendingOffersForFighter(fighter.id);
      const bouts = getBoutsForFighter(fighter.id);
      const body = dashboardPage({ fighter, isAdmin: admin, fighterCount, eventCount, pendingOffers, bouts });
      return sendHtml(res, 200, layout({ title: "Home", user, admin, body, active: "home" }));
    }

    if (req.method === "GET" && pathname === "/signup") {
      if (user) return sendRedirect(res, "/me");
      return sendHtml(res, 200, layout({ title: "Register", user, body: signupPage({}), active: "signup" }));
    }

    if (req.method === "GET" && pathname === "/login") {
      if (user) return sendRedirect(res, "/me");
      return sendHtml(res, 200, layout({ title: "Log In", user, body: loginPage({}), active: "login" }));
    }

    if (req.method === "GET" && pathname === "/me") {
      if (!user) return sendRedirect(res, "/login");
      const fighter = getFighterByUserId(user.id);
      if (!fighter) return sendRedirect(res, "/register");
      return sendRedirect(res, `/fighters/${fighter.id}`);
    }

    if (req.method === "GET" && pathname === "/register") {
      if (!user) return sendRedirect(res, "/login");
      const fighter = getFighterByUserId(user.id) || {};
      const body = registerPage({
        fighter,
        weightDivisionsByType: weightDivisionsByTypeJson(),
        isEdit: !!fighter.id,
      });
      return sendHtml(res, 200, layout({ title: "Fighter Profile", user, body, active: "register" }));
    }

    if (req.method === "GET" && pathname === "/fighters") {
      if (!user) return sendRedirect(res, "/login");
      const fighters = getAllFightersWithDivision();
      const fightersByDiv = {};
      for (const f of fighters) {
        if (f.weight_division_id == null) continue;
        (fightersByDiv[f.weight_division_id] ||= []).push(f);
      }
      const body = fighterProfilesPage({
        amateurDivisions: getWeightDivisions("amateur"),
        proDivisions: getWeightDivisions("professional"),
        fightersByDiv,
        totalFighters: fighters.length,
      });
      return sendHtml(res, 200, layout({ title: "Fighter Profiles", user, admin, body, active: "roster" }));
    }

    // ---------- Fight night events ----------
    if (req.method === "GET" && pathname === "/events") {
      if (!user) return sendRedirect(res, "/login");
      const events = getEvents();
      return sendHtml(res, 200, layout({ title: "Upcoming Fight Nights", user, admin, body: eventsListPage({ events, isAdmin: admin }), active: "events" }));
    }

    if (req.method === "GET" && pathname === "/events/new") {
      if (!user) return sendRedirect(res, "/login");
      if (!admin) return sendRedirect(res, "/events");
      return sendHtml(res, 200, layout({ title: "Create Fight Night", user, admin, body: eventFormPage({}), active: "events" }));
    }

    // ---------- Matchmaking (admin) ----------
    if (req.method === "GET" && pathname === "/matchmaking") {
      if (!user) return sendRedirect(res, "/login");
      if (!admin) return sendRedirect(res, "/");
      const body = matchmakingPage({
        pickerFighters: getFightersForPicker(),
        events: getEvents(),
        matches: getAllMatchesAdmin(),
      });
      return sendHtml(res, 200, layout({ title: "Matchmaking", user, admin, body, active: "matchmaking" }));
    }

    const eventMatch = pathname.match(/^\/events\/(\d+)$/);
    if (req.method === "GET" && eventMatch) {
      if (!user) return sendRedirect(res, "/login");
      const event = getEventById(Number(eventMatch[1]));
      if (!event) {
        return sendHtml(res, 404, layout({ title: "Not Found", user, admin, body: `<div class="section wrap empty-state"><h2>Fight night not found</h2><a href="/events">Back to fight nights</a></div>` }));
      }
      const myFighter = getFighterByUserId(user.id);
      const nominees = getNomineesForEvent(event.id);
      const alreadyNominated = myFighter ? hasNominated(event.id, myFighter.id) : false;
      const card = getConfirmedMatchesForEvent(event.id);
      const body = eventDetailPage({ event, nominees, myFighter, alreadyNominated, isAdmin: admin, card });
      return sendHtml(res, 200, layout({ title: event.title, user, admin, body, active: "events" }));
    }

    const fighterMatch = pathname.match(/^\/fighters\/(\d+)$/);
    if (req.method === "GET" && fighterMatch) {
      if (!user) return sendRedirect(res, "/login");
      const fighter = getFighterById(Number(fighterMatch[1]));
      if (!fighter) {
        return sendHtml(res, 404, layout({ title: "Not Found", user, admin, body: `<div class="section wrap empty-state"><h2>Fighter not found</h2><a href="/fighters">Back to profiles</a></div>` }));
      }
      const weightDivision = getWeightDivisionById(fighter.weight_division_id);
      const bio = buildBio(fighter, weightDivision);
      const isOwner = !!user && user.id === fighter.user_id;
      const bouts = getBoutsForFighter(fighter.id);
      const body = fighterProfilePage({ fighter, weightDivision, bio, isOwner, admin, bouts });
      return sendHtml(res, 200, layout({ title: fighter.full_name, user, admin, body, active: "roster" }));
    }

    // ---------- POST routes ----------
    if (req.method === "POST" && pathname === "/signup") {
      const raw = await readBody(req);
      const params = new URLSearchParams(raw.toString("utf8"));
      const email = (params.get("email") || "").trim().toLowerCase();
      const password = params.get("password") || "";
      const password2 = params.get("password2") || "";

      if (!email || !password) {
        return sendHtml(res, 400, layout({ title: "Register", user, body: signupPage({ error: "Email and password are required." }) }));
      }
      if (password.length < 8) {
        return sendHtml(res, 400, layout({ title: "Register", user, body: signupPage({ error: "Password must be at least 8 characters." }) }));
      }
      if (password !== password2) {
        return sendHtml(res, 400, layout({ title: "Register", user, body: signupPage({ error: "Passwords do not match." }) }));
      }
      try {
        const userId = createUser(email, password);
        const { token, expires } = createSession(userId);
        return sendRedirect(res, "/register", sessionCookie(token, expires));
      } catch (e) {
        if (e.message === "EMAIL_TAKEN") {
          return sendHtml(res, 400, layout({ title: "Register", user, body: signupPage({ error: "An account with that email already exists." }) }));
        }
        throw e;
      }
    }

    if (req.method === "POST" && pathname === "/login") {
      const raw = await readBody(req);
      const params = new URLSearchParams(raw.toString("utf8"));
      const email = (params.get("email") || "").trim().toLowerCase();
      const password = params.get("password") || "";
      const found = findUserByEmail(email);
      if (!found || !verifyPassword(password, found.password_hash)) {
        return sendHtml(res, 400, layout({ title: "Log In", user, body: loginPage({ error: "Incorrect email or password." }) }));
      }
      const { token, expires } = createSession(found.id);
      return sendRedirect(res, "/me", sessionCookie(token, expires));
    }

    if (req.method === "POST" && pathname === "/logout") {
      if (cookies.session) destroySession(cookies.session);
      return sendRedirect(res, "/", clearSessionCookie());
    }

    if (req.method === "POST" && pathname === "/register") {
      if (!user) return sendRedirect(res, "/login");

      const contentType = req.headers["content-type"] || "";
      const boundary = getBoundary(contentType);
      if (!boundary) {
        return sendHtml(res, 400, layout({ title: "Fighter Profile", user, body: registerPage({ fighter: {}, weightDivisionsByType: weightDivisionsByTypeJson(), error: "Invalid form submission." }) }));
      }

      let raw;
      try {
        raw = await readBody(req);
      } catch (e) {
        return sendHtml(res, 413, layout({ title: "Fighter Profile", user, body: registerPage({ fighter: {}, weightDivisionsByType: weightDivisionsByTypeJson(), error: "Upload too large. Please use a smaller photo (max 12MB)." }) }));
      }
      const { fields, files } = parseMultipart(raw, boundary);
      const existingFighter = getFighterByUserId(user.id) || {};
      const isEdit = !!existingFighter.id;

      const validationError = validateRegistrationFields(fields);
      if (validationError) {
        return sendHtml(res, 400, layout({ title: "Fighter Profile", user, body: registerPage({ fighter: { ...existingFighter, ...fields }, weightDivisionsByType: weightDivisionsByTypeJson(), error: validationError, isEdit }) }));
      }

      const photoFile = files.photo;
      if (!isEdit && (!photoFile || !photoFile.data || photoFile.data.length === 0)) {
        return sendHtml(res, 400, layout({ title: "Fighter Profile", user, body: registerPage({ fighter: fields, weightDivisionsByType: weightDivisionsByTypeJson(), error: "Please upload a clear photo of your face.", isEdit }) }));
      }
      if (photoFile && photoFile.data && photoFile.data.length > 0 && !isAllowedPhotoType(photoFile.contentType)) {
        return sendHtml(res, 400, layout({ title: "Fighter Profile", user, body: registerPage({ fighter: fields, weightDivisionsByType: weightDivisionsByTypeJson(), error: "Photo must be a JPEG, PNG or WEBP image.", isEdit }) }));
      }

      const record = {
        full_name: fields.full_name.trim(),
        gym_name: fields.gym_name.trim(),
        coach_name: fields.coach_name.trim(),
        gym_town: fields.gym_town.trim(),
        gym_postcode: fields.gym_postcode.trim(),
        boxer_type: fields.boxer_type,
        weight_division_id: Number(fields.weight_division_id),
        wins: Number(fields.wins) || 0,
        losses: Number(fields.losses) || 0,
        draws: Number(fields.draws) || 0,
        exhibition_bouts: Number(fields.exhibition_bouts) || 0,
        ko_tko_wins: Number(fields.ko_tko_wins) || 0,
        has_title: fields.has_title === "yes" ? 1 : 0,
        title_level: fields.has_title === "yes" ? fields.title_level : null,
        title_region: fields.has_title === "yes" && fields.title_level === "regional" ? (fields.title_region || "").trim() || null : null,
        title_current: fields.has_title === "yes" && fields.title_current === "current" ? 1 : 0,
        availability: ["open", "selective", "unavailable"].includes(fields.availability) ? fields.availability : "open",
      };

      let fighterId;
      if (isEdit) {
        fighterId = existingFighter.id;
        db.prepare(
          `UPDATE fighters SET full_name=?, gym_name=?, coach_name=?, gym_town=?, gym_postcode=?, boxer_type=?, weight_division_id=?, wins=?, losses=?, draws=?, exhibition_bouts=?, ko_tko_wins=?, has_title=?, title_level=?, title_region=?, title_current=?, availability=?, updated_at=datetime('now') WHERE id=?`
        ).run(
          record.full_name, record.gym_name, record.coach_name, record.gym_town, record.gym_postcode,
          record.boxer_type, record.weight_division_id, record.wins, record.losses, record.draws,
          record.exhibition_bouts, record.ko_tko_wins, record.has_title, record.title_level, record.title_region,
          record.title_current, record.availability, fighterId
        );
      } else {
        const info = db.prepare(
          `INSERT INTO fighters (user_id, full_name, gym_name, coach_name, gym_town, gym_postcode, boxer_type, weight_division_id, wins, losses, draws, exhibition_bouts, ko_tko_wins, has_title, title_level, title_region, title_current, availability)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          user.id, record.full_name, record.gym_name, record.coach_name, record.gym_town, record.gym_postcode,
          record.boxer_type, record.weight_division_id, record.wins, record.losses, record.draws,
          record.exhibition_bouts, record.ko_tko_wins, record.has_title, record.title_level, record.title_region,
          record.title_current, record.availability
        );
        fighterId = Number(info.lastInsertRowid);
      }

      if (photoFile && photoFile.data && photoFile.data.length > 0) {
        const filename = await saveFighterPhoto(fighterId, photoFile.data);
        db.prepare("UPDATE fighters SET photo_path=? WHERE id=?").run(filename, fighterId);
      }

      return sendRedirect(res, `/fighters/${fighterId}`);
    }

    // Create a fight night (admin only)
    if (req.method === "POST" && pathname === "/events") {
      if (!user) return sendRedirect(res, "/login");
      if (!admin) return sendRedirect(res, "/events");

      const contentType = req.headers["content-type"] || "";
      const boundary = getBoundary(contentType);
      if (!boundary) {
        return sendHtml(res, 400, layout({ title: "Create Fight Night", user, admin, body: eventFormPage({ error: "Invalid form submission." }) }));
      }
      let raw;
      try {
        raw = await readBody(req);
      } catch (e) {
        return sendHtml(res, 413, layout({ title: "Create Fight Night", user, admin, body: eventFormPage({ error: "Upload too large. Please use a smaller photo (max 12MB)." }) }));
      }
      const { fields, files } = parseMultipart(raw, boundary);

      const title = (fields.title || "").trim();
      const location = (fields.location || "").trim();
      const eventDate = (fields.event_date || "").trim();
      const eventType = (fields.event_type || "").trim();
      if (!title || !location || !eventDate || !eventType) {
        return sendHtml(res, 400, layout({ title: "Create Fight Night", user, admin, body: eventFormPage({ error: "Please fill in the title, date, night type and town.", values: fields }) }));
      }
      if (!EVENT_TYPES.includes(eventType)) {
        return sendHtml(res, 400, layout({ title: "Create Fight Night", user, admin, body: eventFormPage({ error: "Please choose a valid night type.", values: fields }) }));
      }
      const photoFile = files.photo;
      if (!photoFile || !photoFile.data || photoFile.data.length === 0) {
        return sendHtml(res, 400, layout({ title: "Create Fight Night", user, admin, body: eventFormPage({ error: "Please upload a photo or poster for the event.", values: fields }) }));
      }
      if (!isAllowedPhotoType(photoFile.contentType)) {
        return sendHtml(res, 400, layout({ title: "Create Fight Night", user, admin, body: eventFormPage({ error: "Event photo must be a JPEG, PNG or WEBP image.", values: fields }) }));
      }

      const eventId = createEvent({
        title,
        location,
        venue: (fields.venue || "").trim(),
        event_date: eventDate,
        event_type: eventType,
        description: (fields.description || "").trim(),
        created_by: user.id,
      });
      const filename = await saveEventPhoto(eventId, photoFile.data);
      setEventPhoto(eventId, filename);
      return sendRedirect(res, `/events/${eventId}`);
    }

    // Nominate / withdraw
    const nominateMatch = pathname.match(/^\/events\/(\d+)\/nominate$/);
    if (req.method === "POST" && nominateMatch) {
      if (!user) return sendRedirect(res, "/login");
      const event = getEventById(Number(nominateMatch[1]));
      if (!event) return sendRedirect(res, "/events");
      const fighter = getFighterByUserId(user.id);
      if (!fighter) return sendRedirect(res, "/register");
      nominate(event.id, fighter.id);
      return sendRedirect(res, `/events/${event.id}`);
    }

    const withdrawMatch = pathname.match(/^\/events\/(\d+)\/withdraw$/);
    if (req.method === "POST" && withdrawMatch) {
      if (!user) return sendRedirect(res, "/login");
      const event = getEventById(Number(withdrawMatch[1]));
      if (!event) return sendRedirect(res, "/events");
      const fighter = getFighterByUserId(user.id);
      if (fighter) withdrawNomination(event.id, fighter.id);
      return sendRedirect(res, `/events/${event.id}`);
    }

    // Create a match offer (admin)
    if (req.method === "POST" && pathname === "/matchmaking") {
      if (!user) return sendRedirect(res, "/login");
      if (!admin) return sendRedirect(res, "/");
      const raw = await readBody(req);
      const params = new URLSearchParams(raw.toString("utf8"));
      const aId = Number(params.get("fighter_a_id"));
      const bId = Number(params.get("fighter_b_id"));
      const eventId = params.get("event_id") ? Number(params.get("event_id")) : null;
      const agreedWeight = (params.get("agreed_weight") || "").trim();
      const note = (params.get("note") || "").trim();

      const renderMM = (opts) =>
        sendHtml(res, opts.status || 200, layout({ title: "Matchmaking", user, admin, active: "matchmaking",
          body: matchmakingPage({ pickerFighters: getFightersForPicker(), events: getEvents(), matches: getAllMatchesAdmin(), error: opts.error, success: opts.success }) }));

      const fa = getFighterById(aId);
      const fb = getFighterById(bId);
      if (!fa || !fb) return renderMM({ error: "Please pick two valid fighters.", status: 400 });
      if (aId === bId) return renderMM({ error: "A fighter can't be matched against themselves.", status: 400 });

      createMatch({ fighter_a_id: aId, fighter_b_id: bId, event_id: eventId, proposed_by: user.id, agreed_weight: agreedWeight, note });
      return renderMM({ success: `Fight offer sent to ${fa.full_name} and ${fb.full_name}. Both must accept before you can confirm it.` });
    }

    // Fighter responds to an offer
    const respondMatch = pathname.match(/^\/matches\/(\d+)\/respond$/);
    if (req.method === "POST" && respondMatch) {
      if (!user) return sendRedirect(res, "/login");
      const fighter = getFighterByUserId(user.id);
      if (!fighter) return sendRedirect(res, "/register");
      const raw = await readBody(req);
      const params = new URLSearchParams(raw.toString("utf8"));
      const response = params.get("response") === "accepted" ? "accepted" : "declined";
      respondToMatch(Number(respondMatch[1]), fighter.id, response);
      return sendRedirect(res, "/");
    }

    // Admin confirm / place / cancel
    const confirmMatchM = pathname.match(/^\/matches\/(\d+)\/confirm$/);
    if (req.method === "POST" && confirmMatchM) {
      if (!user || !admin) return sendRedirect(res, "/");
      const raw = await readBody(req);
      const params = new URLSearchParams(raw.toString("utf8"));
      const eventId = params.get("event_id") ? Number(params.get("event_id")) : null;
      confirmMatch(Number(confirmMatchM[1]), eventId);
      return sendRedirect(res, "/matchmaking");
    }

    const placeMatchM = pathname.match(/^\/matches\/(\d+)\/place$/);
    if (req.method === "POST" && placeMatchM) {
      if (!user || !admin) return sendRedirect(res, "/");
      const raw = await readBody(req);
      const params = new URLSearchParams(raw.toString("utf8"));
      const eventId = params.get("event_id") ? Number(params.get("event_id")) : null;
      placeMatchOnEvent(Number(placeMatchM[1]), eventId);
      return sendRedirect(res, "/matchmaking");
    }

    const cancelMatchM = pathname.match(/^\/matches\/(\d+)\/cancel$/);
    if (req.method === "POST" && cancelMatchM) {
      if (!user || !admin) return sendRedirect(res, "/");
      cancelMatch(Number(cancelMatchM[1]));
      return sendRedirect(res, "/matchmaking");
    }

    // 404
    return sendHtml(res, 404, layout({ title: "Not Found", user, admin, body: `<div class="section wrap empty-state"><h2>Page not found</h2><a href="/">Back home</a></div>` }));
  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal server error");
  }
});

server.listen(PORT, () => {
  console.log(`Fight Club NSW running at http://localhost:${PORT}`);
});
