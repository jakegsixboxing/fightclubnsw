import { escapeHtml } from "./layout.mjs";
import { titleBadgeText } from "./titles.mjs";

export function homePage() {
  return `
  <section class="hero">
    <div class="wrap">
      <img src="/public/logo.png" alt="Fight Club NSW" class="hero-logo">
      <h1>FIGHT CLUB <span style="color:var(--gold)">NSW</span></h1>
      <div class="nsw-rule"><span></span>Fight Nights<span></span></div>
      <p class="lede">Register your interest for our fight nights. Build your fighter profile, log your record, and show the state what you bring to the ring &mdash; amateur and professional boxers welcome.</p>
      <div class="hero-ctas">
        <a href="/signup" class="btn btn-gold">Register as a Fighter</a>
        <a href="/fighters" class="btn btn-outline">View Fighter Roster</a>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="wrap">
      <h2 style="text-align:center">What your profile covers</h2>
      <div class="divider-gold"></div>
      <div class="feature-grid">
        <div class="card">
          <div class="icon">🥊</div>
          <h3>Fight Record</h3>
          <p>Wins, losses, draws, exhibition bouts and your KO/TKO count, all on one profile.</p>
        </div>
        <div class="card">
          <div class="icon">🏆</div>
          <h3>Title History</h3>
          <p>Current or former Regional, NSW or Australian title holders get a champion badge &mdash; and a gold banner across their photo while they hold it.</p>
        </div>
        <div class="card">
          <div class="icon">📍</div>
          <h3>Gym &amp; Location</h3>
          <p>Your gym, coach and hometown are shown on your profile so fans and matchmakers know where you're from.</p>
        </div>
        <div class="card">
          <div class="icon">⚖️</div>
          <h3>Amateur &amp; Pro Weights</h3>
          <p>Pick amateur or professional and choose your division from the correct weight list.</p>
        </div>
      </div>
    </div>
  </section>
  `;
}

export function signupPage({ error } = {}) {
  return `
  <section class="section">
    <div class="wrap">
      <div class="card form-card">
        <h2 style="text-align:center">Register an Account</h2>
        ${error ? `<div class="flash flash-error">${escapeHtml(error)}</div>` : ""}
        <form method="POST" action="/signup">
          <div class="field">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" minlength="8" required>
            <p class="help-text">At least 8 characters.</p>
          </div>
          <div class="field">
            <label for="password2">Confirm Password</label>
            <input type="password" id="password2" name="password2" minlength="8" required>
          </div>
          <button type="submit" class="btn btn-gold" style="width:100%">Create Account</button>
        </form>
        <p style="text-align:center;margin-top:16px;color:var(--grey)">Already registered? <a href="/login">Log in</a></p>
      </div>
    </div>
  </section>
  `;
}

export function loginPage({ error } = {}) {
  return `
  <section class="section">
    <div class="wrap">
      <div class="card form-card">
        <h2 style="text-align:center">Log In</h2>
        ${error ? `<div class="flash flash-error">${escapeHtml(error)}</div>` : ""}
        <form method="POST" action="/login">
          <div class="field">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
          </div>
          <button type="submit" class="btn btn-gold" style="width:100%">Log In</button>
        </form>
        <p style="text-align:center;margin-top:16px;color:var(--grey)">New here? <a href="/signup">Register</a></p>
      </div>
    </div>
  </section>
  `;
}

function radioOption(name, value, currentValue, labelText) {
  const checked = String(currentValue) === String(value) ? "checked" : "";
  return `<label class="radio-option"><input type="radio" name="${name}" value="${value}" ${checked} required> ${labelText}</label>`;
}

export function registerPage({ fighter = {}, weightDivisionsByType, error, isEdit }) {
  const boxerType = fighter.boxer_type || "amateur";
  const hasTitle = fighter.has_title ? "yes" : (fighter.id ? "no" : "");
  const titleLevel = fighter.title_level || "";
  const titleCurrent = fighter.title_current ? "current" : (fighter.id && fighter.has_title ? "former" : "");

  return `
  <section class="section">
    <div class="wrap">
      <div class="card form-card wide">
        <h2 style="text-align:center">${isEdit ? "Edit Your Fighter Profile" : "Create Your Fighter Profile"}</h2>
        <div class="divider-gold"></div>
        ${error ? `<div class="flash flash-error">${escapeHtml(error)}</div>` : ""}
        <form method="POST" action="/register" enctype="multipart/form-data">
          <div class="field">
            <label for="full_name">Full Name</label>
            <input type="text" id="full_name" name="full_name" value="${escapeHtml(fighter.full_name || "")}" required>
          </div>

          <div class="field">
            <label for="photo">Photo ${isEdit ? "(upload a new photo to replace your current one)" : ""}</label>
            <input type="file" id="photo" name="photo" accept="image/png,image/jpeg,image/webp" ${isEdit ? "" : "required"}>
            <p class="help-text">Please upload a clear, front-facing photo that shows your face. This is what appears on your fighter profile and roster card.</p>
            <img id="photo-preview" src="" alt="Preview" style="display:none;margin-top:10px;max-width:180px;border-radius:8px;border:2px solid var(--gold-dark)">
          </div>

          <div class="field-row">
            <div class="field">
              <label for="gym_name">Gym Name</label>
              <input type="text" id="gym_name" name="gym_name" value="${escapeHtml(fighter.gym_name || "")}" required>
            </div>
            <div class="field">
              <label for="coach_name">Coach Name</label>
              <input type="text" id="coach_name" name="coach_name" value="${escapeHtml(fighter.coach_name || "")}" required>
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="gym_town">Gym Town / Suburb</label>
              <input type="text" id="gym_town" name="gym_town" value="${escapeHtml(fighter.gym_town || "")}" required>
            </div>
            <div class="field">
              <label for="gym_postcode">Gym Postcode</label>
              <input type="text" id="gym_postcode" name="gym_postcode" pattern="[0-9]{4}" maxlength="4" value="${escapeHtml(fighter.gym_postcode || "")}" required>
            </div>
          </div>

          <div class="field">
            <label>Amateur or Professional?</label>
            <div class="radio-group">
              ${radioOption("boxer_type", "amateur", boxerType, "Amateur")}
              ${radioOption("boxer_type", "professional", boxerType, "Professional")}
            </div>
          </div>

          <div class="field">
            <label for="weight_division_id">Weight Division</label>
            <select id="weight_division_id" name="weight_division_id" data-selected="${fighter.weight_division_id || ""}" required></select>
          </div>
          <script type="application/json" id="weight-divisions-data">${JSON.stringify(weightDivisionsByType)}</script>

          <h3 style="margin-top:30px">Fight Record</h3>
          <div class="field-row-3">
            <div class="field">
              <label for="wins">Wins</label>
              <input type="number" id="wins" name="wins" min="0" value="${fighter.wins ?? 0}" required>
            </div>
            <div class="field">
              <label for="losses">Losses</label>
              <input type="number" id="losses" name="losses" min="0" value="${fighter.losses ?? 0}" required>
            </div>
            <div class="field">
              <label for="draws">Draws</label>
              <input type="number" id="draws" name="draws" min="0" value="${fighter.draws ?? 0}">
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="exhibition_bouts">Exhibition Bouts</label>
              <input type="number" id="exhibition_bouts" name="exhibition_bouts" min="0" value="${fighter.exhibition_bouts ?? 0}">
            </div>
            <div class="field">
              <label for="ko_tko_wins">Wins by KO/TKO</label>
              <input type="number" id="ko_tko_wins" name="ko_tko_wins" min="0" value="${fighter.ko_tko_wins ?? 0}">
            </div>
          </div>

          <h3 style="margin-top:30px">Title History</h3>
          <div class="field">
            <label>Do you hold, or have you ever held, a Regional, NSW, or Australian title?</label>
            <div class="radio-group">
              ${radioOption("has_title", "yes", hasTitle, "Yes")}
              ${radioOption("has_title", "no", hasTitle, "No")}
            </div>
          </div>
          <div id="title-details" style="display:none">
            <div class="field">
              <label>Title Level</label>
              <div class="radio-group">
                ${radioOption("title_level", "regional", titleLevel, "Regional")}
                ${radioOption("title_level", "nsw", titleLevel, "NSW")}
                ${radioOption("title_level", "australian", titleLevel, "Australian")}
              </div>
            </div>
            <div class="field" id="title-region-field" style="display:none">
              <label for="title_region">Region Name</label>
              <input type="text" id="title_region" name="title_region" placeholder="e.g. Central Coast, Hunter, Illawarra" value="${escapeHtml(fighter.title_region || "")}">
            </div>
            <div class="field">
              <label>Current or Former Title Holder?</label>
              <div class="radio-group">
                ${radioOption("title_current", "current", titleCurrent, "Current Title Holder")}
                ${radioOption("title_current", "former", titleCurrent, "Former Title Holder")}
              </div>
              <p class="help-text">Current title holders get a gold "CHAMPION" banner across their profile photo.</p>
            </div>
          </div>

          <button type="submit" class="btn btn-gold" style="width:100%;margin-top:10px">${isEdit ? "Save Changes" : "Create My Profile"}</button>
        </form>
      </div>
    </div>
  </section>
  `;
}

function statBox(num, label) {
  return `<div class="stat-box"><span class="num">${num}</span><span class="lbl">${label}</span></div>`;
}

export function fighterProfilePage({ fighter, weightDivision, bio, isOwner, overlayText }) {
  const totalBouts = fighter.wins + fighter.losses + fighter.draws;
  const koRate = fighter.wins > 0 ? Math.round((fighter.ko_tko_wins / fighter.wins) * 100) : 0;
  const badge = titleBadgeText(fighter);

  let titlesTabContent;
  if (badge) {
    titlesTabContent = `
      <div class="badge-inline">🏆 ${escapeHtml(badge)}</div>
      <p style="margin-top:16px;color:var(--grey)">
        ${fighter.title_current ? "Currently holds" : "Previously held"} the
        ${escapeHtml(
          fighter.title_level === "regional"
            ? `${fighter.title_region || "Regional"} Regional`
            : fighter.title_level === "nsw"
            ? "NSW"
            : "Australian"
        )} title.
      </p>
    `;
  } else {
    titlesTabContent = `<p style="color:var(--grey)">No regional, NSW, or Australian titles recorded yet.</p>`;
  }

  return `
  <section class="section">
    <div class="wrap">
      ${isOwner ? `<div style="text-align:right;margin-bottom:16px"><a href="/register" class="btn btn-outline btn-small">Edit Profile</a></div>` : ""}
      <div class="profile-head">
        <div>
          <div class="profile-photo">
            <img src="/photo/${fighter.id}" alt="${escapeHtml(fighter.full_name)}">
          </div>
        </div>
        <div>
          ${fighter.has_title ? (fighter.title_current
            ? `<span class="champ-tag">🏆 ${escapeHtml(badge)}</span><br>`
            : `<span class="former-tag">${escapeHtml(badge)}</span><br>`) : ""}
          <h1 class="profile-name">${escapeHtml(fighter.full_name)}</h1>
          <p class="record-pill">${fighter.wins}-${fighter.losses}-${fighter.draws} &nbsp;|&nbsp; ${fighter.boxer_type === "professional" ? "Professional" : "Amateur"} &nbsp;|&nbsp; ${weightDivision ? escapeHtml(weightDivision.label) : ""}</p>
          <p class="profile-bio">${escapeHtml(bio)}</p>
          <div class="stat-row">
            ${statBox(fighter.wins, "Wins")}
            ${statBox(fighter.losses, "Losses")}
            ${statBox(fighter.draws, "Draws")}
            ${statBox(fighter.exhibition_bouts, "Exhibition")}
            ${statBox(fighter.ko_tko_wins, "KO/TKO")}
          </div>
        </div>
      </div>

      <div data-tab-group>
        <div class="tabs">
          <button class="tab-btn active" data-tab-target="tab-record">Record</button>
          <button class="tab-btn" data-tab-target="tab-ko">Wins by TKO/KO</button>
          <button class="tab-btn" data-tab-target="tab-titles">Titles &amp; Achievements</button>
        </div>
        <div id="tab-record" class="tab-panel active">
          <table class="data-table">
            <tr><th>Wins</th><td>${fighter.wins}</td></tr>
            <tr><th>Losses</th><td>${fighter.losses}</td></tr>
            <tr><th>Draws</th><td>${fighter.draws}</td></tr>
            <tr><th>Exhibition Bouts</th><td>${fighter.exhibition_bouts}</td></tr>
            <tr><th>Total Bouts</th><td>${totalBouts}</td></tr>
          </table>
        </div>
        <div id="tab-ko" class="tab-panel">
          <div class="stat-row">
            ${statBox(fighter.ko_tko_wins, "Wins by KO/TKO")}
            ${statBox(`${koRate}%`, "of Wins by KO/TKO")}
          </div>
          <p style="color:var(--grey)">${fighter.full_name.split(" ")[0]} has won ${fighter.ko_tko_wins} of their ${fighter.wins} fight${fighter.wins === 1 ? "" : "s"} by knockout or technical knockout.</p>
        </div>
        <div id="tab-titles" class="tab-panel">
          ${titlesTabContent}
        </div>
      </div>
    </div>
  </section>
  `;
}

// ---------- Shared fighter card ----------
export function fighterCardHtml(f) {
  const badge = titleBadgeText(f);
  return `
  <a class="fighter-card" href="/fighters/${f.id}">
    <div class="fighter-photo-wrap">
      <img src="/photo/${f.id}" alt="${escapeHtml(f.full_name)}" loading="lazy">
    </div>
    <div class="fighter-card-body">
      ${f.has_title ? (f.title_current ? `<span class="champ-tag">🏆 ${escapeHtml(badge)}</span>` : `<span class="former-tag">${escapeHtml(badge)}</span>`) : ""}
      <h3>${escapeHtml(f.full_name)}</h3>
      <p class="fighter-meta">${escapeHtml(f.gym_name)} &middot; ${escapeHtml(f.gym_town)}</p>
      <p class="fighter-meta">${f.boxer_type === "professional" ? "Professional" : "Amateur"} &middot; ${f.division_label ? escapeHtml(f.division_label) : ""}</p>
      <span class="record-pill">${f.wins}-${f.losses}-${f.draws}</span>
    </div>
  </a>`;
}

// ---------- Date helper ----------
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function formatEventDate(str) {
  if (!str) return "";
  const m = String(str).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return escapeHtml(str);
  const [, y, mo, d, hh, mm] = m;
  const dow = DAYS[new Date(Date.UTC(+y, +mo - 1, +d)).getUTCDay()];
  let out = `${dow} ${+d} ${MONTHS[+mo - 1]} ${y}`;
  if (hh != null) {
    let h = +hh;
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    out += ` · ${h}:${mm} ${ampm}`;
  }
  return out;
}

// ---------- Dashboard hub ----------
export function dashboardPage({ fighter, isAdmin, fighterCount, eventCount }) {
  const firstName = fighter.full_name.split(" ")[0];
  return `
  <section class="section-tight">
    <div class="wrap">
      <div class="dash-welcome">
        <div>
          <div class="nsw-rule" style="justify-content:flex-start;margin-bottom:6px"><span></span>Members Area<span></span></div>
          <h1 style="margin-bottom:2px">Welcome back, ${escapeHtml(firstName)}</h1>
          <p style="color:var(--grey);margin:0">Choose where you want to go.</p>
        </div>
        <a href="/fighters/${fighter.id}" class="dash-mini">
          <img src="/photo/${fighter.id}" alt="${escapeHtml(fighter.full_name)}">
          <span>View my<br>profile</span>
        </a>
      </div>

      <div class="hub-grid">
        <a class="hub-tab" href="/fighters">
          <div class="hub-icon">🥊</div>
          <h2>Fighter Profiles</h2>
          <p>Browse every registered fighter, sorted into their weight division.</p>
          <span class="hub-count">${fighterCount} fighter${fighterCount === 1 ? "" : "s"}</span>
        </a>
        <a class="hub-tab" href="/events">
          <div class="hub-icon">📅</div>
          <h2>Upcoming Fight Nights</h2>
          <p>See scheduled fight nights and nominate yourself to fight on the card.</p>
          <span class="hub-count">${eventCount} event${eventCount === 1 ? "" : "s"}</span>
        </a>
        <a class="hub-tab" href="/fighters/${fighter.id}">
          <div class="hub-icon">👤</div>
          <h2>My Profile</h2>
          <p>View or edit your fighter profile, record and title status.</p>
          <span class="hub-count">Edit anytime</span>
        </a>
        ${isAdmin ? `
        <a class="hub-tab hub-tab-admin" href="/events/new">
          <div class="hub-icon">➕</div>
          <h2>Create Fight Night</h2>
          <p>Admin: add a new fight night event for fighters to nominate for.</p>
          <span class="hub-count">Admin only</span>
        </a>` : ""}
      </div>
    </div>
  </section>
  `;
}

// ---------- Fighter Profiles by division ----------
export function fighterProfilesPage({ amateurDivisions, proDivisions, fightersByDiv, totalFighters }) {
  function pills(divisions, type, groupTotal) {
    const all = `<button class="div-pill active" data-div-btn data-type="${type}" data-div="all">All <em>${groupTotal}</em></button>`;
    const rest = divisions
      .map((d) => {
        const count = (fightersByDiv[d.id] || []).length;
        return `<button class="div-pill${count ? "" : " is-empty"}" data-div-btn data-type="${type}" data-div="${d.id}">${escapeHtml(d.name)} <em>${count}</em></button>`;
      })
      .join("");
    return all + rest;
  }

  function cards(divisions, type) {
    return divisions
      .map((d) => (fightersByDiv[d.id] || []).map((f) => `<div class="fighter-cell" data-fighter data-type="${type}" data-div="${d.id}">${fighterCardHtml(f)}</div>`).join(""))
      .join("");
  }

  const amateurTotal = amateurDivisions.reduce((s, d) => s + (fightersByDiv[d.id] || []).length, 0);
  const proTotal = proDivisions.reduce((s, d) => s + (fightersByDiv[d.id] || []).length, 0);

  return `
  <section class="section-tight">
    <div class="wrap">
      <a href="/" class="back-link">← Home</a>
      <h1 style="text-align:center">Fighter Profiles</h1>
      <p style="text-align:center;color:var(--grey)">${totalFighters} fighter${totalFighters === 1 ? "" : "s"} registered · pick a weight division</p>

      <div class="profiles" data-profiles>
        <div class="type-toggle">
          <button class="type-btn active" data-type-btn="amateur">Amateur</button>
          <button class="type-btn" data-type-btn="professional">Professional</button>
        </div>

        <div class="div-pills" data-type-group="amateur">${pills(amateurDivisions, "amateur", amateurTotal)}</div>
        <div class="div-pills" data-type-group="professional" hidden>${pills(proDivisions, "professional", proTotal)}</div>

        <div class="roster-grid" data-fighter-grid>
          ${cards(amateurDivisions, "amateur")}
          ${cards(proDivisions, "professional")}
        </div>
        <div class="empty-state" data-empty hidden>
          <p>No fighters in this division yet.</p>
        </div>
      </div>
    </div>
  </section>
  `;
}

// ---------- Fight nights ----------
const EVENT_TYPES = ["Amateur", "Pro-Am", "Professional"];

export function eventsListPage({ events, isAdmin }) {
  const adminBtn = isAdmin
    ? `<div style="text-align:center;margin-bottom:24px"><a href="/events/new" class="btn btn-gold">➕ Create Fight Night</a></div>`
    : "";

  if (!events.length) {
    return `
    <section class="section">
      <div class="wrap">
        <a href="/" class="back-link">← Home</a>
        <h1 style="text-align:center">Upcoming Fight Nights</h1>
        ${adminBtn}
        <div class="empty-state">
          <p>No fight nights have been announced yet. Check back soon.</p>
        </div>
      </div>
    </section>`;
  }

  const cards = events
    .map((e) => `
      <a class="event-card" href="/events/${e.id}">
        <div class="event-photo">
          <img src="/event-photo/${e.id}" alt="${escapeHtml(e.title)}" loading="lazy">
          <span class="event-type-tag">${escapeHtml(e.event_type)}</span>
        </div>
        <div class="event-card-body">
          <h2>${escapeHtml(e.title)}</h2>
          <p class="event-meta">📅 ${formatEventDate(e.event_date)}</p>
          <p class="event-meta">📍 ${escapeHtml(e.location)}${e.venue ? " · " + escapeHtml(e.venue) : ""}</p>
          <div class="event-card-foot">
            <span class="nominee-pill">${e.nominee_count} nominated</span>
            <span class="event-cta">View &amp; Nominate →</span>
          </div>
        </div>
      </a>`)
    .join("");

  return `
  <section class="section-tight">
    <div class="wrap">
      <a href="/" class="back-link">← Home</a>
      <h1 style="text-align:center">Upcoming Fight Nights</h1>
      ${adminBtn}
      <div class="events-list">${cards}</div>
    </div>
  </section>
  `;
}

export function eventDetailPage({ event, nominees, myFighter, alreadyNominated, isAdmin }) {
  const nomineeCards = nominees.length
    ? `<div class="roster-grid">${nominees.map(fighterCardHtml).join("")}</div>`
    : `<div class="empty-state"><p>No one has nominated yet. Be the first to put your hand up.</p></div>`;

  let nominateBox;
  if (alreadyNominated) {
    nominateBox = `
      <div class="nominate-box nominated">
        <p class="nominate-status">✅ You're nominated for this fight night.</p>
        <form method="POST" action="/events/${event.id}/withdraw">
          <button type="submit" class="btn btn-outline btn-small">Withdraw nomination</button>
        </form>
      </div>`;
  } else {
    nominateBox = `
      <div class="nominate-box">
        <p style="color:var(--grey);margin:0 0 12px">Want to fight on this card? Put your hand up — your profile goes straight onto the nominated list.</p>
        <form method="POST" action="/events/${event.id}/nominate">
          <button type="submit" class="btn btn-gold btn-big">🥊 Nominate Here</button>
        </form>
      </div>`;
  }

  return `
  <section class="section-tight">
    <div class="wrap">
      <a href="/events" class="back-link">← All Fight Nights</a>
      <div class="event-hero">
        <img src="/event-photo/${event.id}" alt="${escapeHtml(event.title)}">
        <span class="event-type-tag big">${escapeHtml(event.event_type)}</span>
      </div>
      <h1 style="margin-top:20px">${escapeHtml(event.title)}</h1>
      <div class="event-detail-meta">
        <span>📅 ${formatEventDate(event.event_date)}</span>
        <span>📍 ${escapeHtml(event.location)}${event.venue ? " · " + escapeHtml(event.venue) : ""}</span>
        <span>🥊 ${escapeHtml(event.event_type)} night</span>
      </div>
      ${event.description ? `<p class="event-description">${escapeHtml(event.description).replace(/\n/g, "<br>")}</p>` : ""}

      ${nominateBox}

      <div class="nsw-rule" style="margin:34px auto 20px"><span></span>Nominated Fighters (${nominees.length})<span></span></div>
      ${nomineeCards}
    </div>
  </section>
  `;
}

export function eventFormPage({ error, values = {} }) {
  const typeOptions = EVENT_TYPES.map(
    (t) => `<option value="${t}" ${values.event_type === t ? "selected" : ""}>${t}</option>`
  ).join("");
  return `
  <section class="section">
    <div class="wrap">
      <div class="card form-card">
        <a href="/events" class="back-link">← All Fight Nights</a>
        <h2 style="text-align:center">Create a Fight Night</h2>
        <div class="divider-gold"></div>
        ${error ? `<div class="flash flash-error">${escapeHtml(error)}</div>` : ""}
        <form method="POST" action="/events" enctype="multipart/form-data">
          <div class="field">
            <label for="title">Event Title</label>
            <input type="text" id="title" name="title" value="${escapeHtml(values.title || "")}" placeholder="e.g. Fight Club NSW — Fight Night 1" required>
          </div>
          <div class="field">
            <label for="photo">Event Photo / Poster</label>
            <input type="file" id="photo" name="photo" accept="image/png,image/jpeg,image/webp" required>
            <p class="help-text">A poster or photo for the event. Shown across the top of the event.</p>
            <img id="photo-preview" src="" alt="Preview" style="display:none;margin-top:10px;max-width:100%;border-radius:8px;border:2px solid var(--gold-dark)">
          </div>
          <div class="field-row">
            <div class="field">
              <label for="event_date">Date &amp; Time</label>
              <input type="datetime-local" id="event_date" name="event_date" value="${escapeHtml(values.event_date || "")}" required>
            </div>
            <div class="field">
              <label for="event_type">Night Type</label>
              <select id="event_type" name="event_type" required>${typeOptions}</select>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="location">Town / City</label>
              <input type="text" id="location" name="location" value="${escapeHtml(values.location || "")}" placeholder="e.g. Newcastle" required>
            </div>
            <div class="field">
              <label for="venue">Venue (optional)</label>
              <input type="text" id="venue" name="venue" value="${escapeHtml(values.venue || "")}" placeholder="e.g. PCYC Hall">
            </div>
          </div>
          <div class="field">
            <label for="description">Details (optional)</label>
            <textarea id="description" name="description" rows="4" placeholder="Weigh-in info, doors open, ticket details, matchmaker contact...">${escapeHtml(values.description || "")}</textarea>
          </div>
          <button type="submit" class="btn btn-gold" style="width:100%">Publish Fight Night</button>
        </form>
      </div>
    </div>
  </section>
  `;
}

export function rosterPage({ fighters }) {
  if (!fighters.length) {
    return `
    <section class="section">
      <div class="wrap">
        <h1 style="text-align:center">Fighter Roster</h1>
        <div class="empty-state">
          <p>No fighters have registered yet.</p>
          <a href="/signup" class="btn btn-gold">Be the first to register</a>
        </div>
      </div>
    </section>`;
  }

  const cards = fighters
    .map((f) => {
      const badge = titleBadgeText(f);
      return `
      <a class="fighter-card" href="/fighters/${f.id}">
        <div class="fighter-photo-wrap">
          <img src="/photo/${f.id}" alt="${escapeHtml(f.full_name)}" loading="lazy">
        </div>
        <div class="fighter-card-body">
          ${f.has_title ? (f.title_current ? `<span class="champ-tag">🏆 ${escapeHtml(badge)}</span>` : `<span class="former-tag">${escapeHtml(badge)}</span>`) : ""}
          <h3>${escapeHtml(f.full_name)}</h3>
          <p class="fighter-meta">${escapeHtml(f.gym_name)} &middot; ${escapeHtml(f.gym_town)}</p>
          <p class="fighter-meta">${f.boxer_type === "professional" ? "Professional" : "Amateur"} &middot; ${f.division_label ? escapeHtml(f.division_label) : ""}</p>
          <span class="record-pill">${f.wins}-${f.losses}-${f.draws}</span>
        </div>
      </a>`;
    })
    .join("");

  return `
  <section class="section">
    <div class="wrap">
      <h1 style="text-align:center">Fighter Roster</h1>
      <p style="text-align:center;color:var(--grey)">${fighters.length} fighter${fighters.length === 1 ? "" : "s"} registered</p>
      <div class="roster-grid">${cards}</div>
    </div>
  </section>
  `;
}
