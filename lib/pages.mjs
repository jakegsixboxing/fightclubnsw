import { escapeHtml } from "./layout.mjs";
import { titleBadgeText } from "./titles.mjs";

export function homePage() {
  return `
  <section class="hero">
    <div class="wrap">
      <img src="/public/logo.png" alt="Prize Fighter NSW" class="hero-logo">
      <h1>PRIZE FIGHTER <span style="color:var(--gold)">NSW</span></h1>
      <div class="nsw-rule"><span></span>Honest NSW Boxing · Real Records · Fair Fights<span></span></div>
      <p class="lede">A new, transparent way to match fights in NSW. Fighters and coaches can see exactly who they're facing — real records, the right weight, the full picture — and <strong>every fight is agreed by both boxers</strong> before it's made. No confusion, nothing hidden. Just straight-up matches.</p>
      <div class="hero-ctas">
        <a href="/signup" class="btn btn-gold">Create Your Fighter Profile</a>
        <a href="/login" class="btn btn-outline">Log In</a>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <h2 style="text-align:center">A transparent way to make matches</h2>
      <div class="divider-gold"></div>
      <p style="text-align:center;color:var(--grey);max-width:720px;margin:0 auto 10px">At Prize Fighter NSW, everything a fighter and coach need is out in the open. You can see your opponent's real record and weight before you commit, and a fight is only made when both boxers look at each other's profile and say yes. No confusion on weight, no question marks over records — just clear, agreed matches.</p>
      <div class="feature-grid">
        <div class="card">
          <div class="icon">🔍</div>
          <h3>Real Records, On Show</h3>
          <p>Every fighter's wins, losses, draws and KO count are on their profile for opponents and coaches to see. What you see is what they've done.</p>
        </div>
        <div class="card">
          <div class="icon">🤝</div>
          <h3>Both Fighters Agree</h3>
          <p>A fight is only made when we match two profiles and <em>both fighters accept</em>. You and your coach decide, with the full picture in front of you.</p>
        </div>
        <div class="card">
          <div class="icon">⚖️</div>
          <h3>Clear on Weight &amp; Level</h3>
          <p>Amateur and pro divisions kept separate, matched on the right weight. Everyone can see the fight is at the correct weight and level.</p>
        </div>
        <div class="card">
          <div class="icon">🥊</div>
          <h3>Fight on Our Cards</h3>
          <p>Nominate for our fight nights, get matched fair, and step onto a Prize Fighter NSW card that fans and scouts can see.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section" style="background:linear-gradient(180deg,#0d0d0d,#0a0a0a);border-top:1px solid var(--line);border-bottom:1px solid var(--line)">
    <div class="wrap">
      <h2 style="text-align:center">How it works</h2>
      <div class="divider-gold"></div>
      <div class="steps-grid">
        <div class="step-card"><span class="step-num">1</span><h3>Build your profile</h3><p>Sign up, upload a clear photo, and log your honest record, division, gym and title history. Amateur or pro, any gym in NSW.</p></div>
        <div class="step-card"><span class="step-num">2</span><h3>Get offered a fight</h3><p>Our matchmakers pair you with a fair opponent — you both see each other's real record before anyone commits.</p></div>
        <div class="step-card"><span class="step-num">3</span><h3>You both agree</h3><p>You accept the offer from your profile. So does your opponent. No agreement, no fight — simple as that.</p></div>
        <div class="step-card"><span class="step-num">4</span><h3>Step on the card</h3><p>The confirmed bout goes on a Prize Fighter NSW fight night for everyone to see. Clean fight, made right.</p></div>
      </div>
      <div style="text-align:center;margin-top:34px">
        <a href="/signup" class="btn btn-gold">Get On The Platform</a>
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

          <h3 style="margin-top:30px">Availability</h3>
          <div class="field">
            <label for="availability">Are you open to fight offers?</label>
            <select id="availability" name="availability">
              <option value="open" ${(fighter.availability || "open") === "open" ? "selected" : ""}>🟢 Open to offers — match me up</option>
              <option value="selective" ${fighter.availability === "selective" ? "selected" : ""}>🟡 Selective — only the right fight</option>
              <option value="unavailable" ${fighter.availability === "unavailable" ? "selected" : ""}>⚪ Not currently available</option>
            </select>
            <p class="help-text">This tells our matchmakers whether to offer you fights. You still approve every offer yourself.</p>
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

export function fighterProfilePage({ fighter, weightDivision, bio, isOwner, admin = false, bouts = [], points = 0 }) {
  const totalBouts = fighter.wins + fighter.losses + fighter.draws;
  const koRate = fighter.wins > 0 ? Math.round((fighter.ko_tko_wins / fighter.wins) * 100) : 0;
  const badgeFighter = { ...fighter, division_name: weightDivision ? weightDivision.name : fighter.division_name };
  const badge = titleBadgeText(badgeFighter);
  const typeLabel = fighter.boxer_type === "professional" ? "Professional" : "Amateur";
  const divLabel = weightDivision ? weightDivision.label : "";
  const tale = [
    ["Record", `${fighter.wins}-${fighter.losses}-${fighter.draws}`],
    ["Wins", fighter.wins],
    ["Losses", fighter.losses],
    ["Draws", fighter.draws],
    ["Exhibitions", fighter.exhibition_bouts],
    ["KO / TKO", fighter.ko_tko_wins],
    ["Points", points],
  ];

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
  <section class="section-tight">
    <div class="wrap">
      <div class="profile-actions">
        <a href="/fighters" class="back-link" style="margin:0">← All Fighters</a>
        <div>
          ${isOwner ? `<a href="/register" class="btn btn-outline btn-small">Edit Profile</a>` : ""}
          ${admin && !isOwner ? `<a href="/matchmaking?a=${fighter.id}" class="btn btn-gold btn-small">🥊 Offer a Match</a>` : ""}
        </div>
      </div>

      <div class="fightcard">
        <div class="fightcard-photo">
          <img src="/photo/${fighter.id}" alt="${escapeHtml(fighter.full_name)}">
        </div>
        <div class="fightcard-info">
          <div class="fightcard-tags">
            ${fighter.has_title ? (fighter.title_current
              ? `<span class="champ-tag">🏆 ${escapeHtml(badge)}</span>`
              : `<span class="former-tag">${escapeHtml(badge)}</span>`) : ""}
            ${availabilityBadge(fighter.availability)}
          </div>
          <h1 class="fightcard-name">${escapeHtml(fighter.full_name)}</h1>
          <div class="fightcard-sub">${typeLabel}${divLabel ? " &middot; " + escapeHtml(divLabel) : ""}</div>
          <div class="fightcard-club">🥊 ${escapeHtml(fighter.gym_name)} &middot; ${escapeHtml(fighter.gym_town)} NSW ${escapeHtml(fighter.gym_postcode || "")}</div>
          <div class="fightcard-coach">Coach: ${escapeHtml(fighter.coach_name)}</div>

          <div class="tale">
            ${tale.map(([l, v]) => `<div class="tale-cell"><span class="tale-val">${v}</span><span class="tale-lbl">${l}</span></div>`).join("")}
          </div>
        </div>
      </div>

      <p class="fightcard-bio">${escapeHtml(bio)}</p>

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

      ${bouts.length ? `
      <div style="margin-top:30px">
        <div class="nsw-rule" style="justify-content:flex-start;margin:0 0 14px"><span></span>Agreed &amp; Upcoming Bouts<span></span></div>
        <div class="matchup-list">${bouts.map((m) => matchupCardHtml(m, { context: "display" })).join("")}</div>
      </div>` : ""}
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
      <div class="fighter-card-foot-row">
        <span class="record-pill">${f.wins}-${f.losses}-${f.draws}</span>
        ${f.availability ? availabilityBadge(f.availability) : ""}
      </div>
    </div>
  </a>`;
}

// ---------- Availability ----------
export function availabilityBadge(availability) {
  if (availability === "open")
    return `<span class="avail-badge avail-open">🟢 Open to offers</span>`;
  if (availability === "selective")
    return `<span class="avail-badge avail-selective">🟡 Selective</span>`;
  if (availability === "unavailable")
    return `<span class="avail-badge avail-unavailable">⚪ Not available</span>`;
  return "";
}

// ---------- Matchup card (A vs B) ----------
function sideHtml(id, name, record, division, type) {
  return `
    <div class="mu-side">
      <img src="/photo/${id}" alt="${escapeHtml(name)}" loading="lazy">
      <div class="mu-side-info">
        <a href="/fighters/${id}" class="mu-name">${escapeHtml(name)}</a>
        <span class="mu-record">${record}</span>
        <span class="mu-div">${type === "professional" ? "Pro" : "Am"}${division ? " · " + escapeHtml(division) : ""}</span>
      </div>
    </div>`;
}

function matchStatusTag(m) {
  if (m.status === "confirmed") return `<span class="mu-status confirmed">✅ Confirmed Bout</span>`;
  if (m.status === "agreed") return `<span class="mu-status agreed">🤝 Both Agreed</span>`;
  if (m.status === "proposed") {
    const a = m.a_response === "accepted" ? "✅" : "⏳";
    const b = m.b_response === "accepted" ? "✅" : "⏳";
    return `<span class="mu-status proposed">Offer sent · ${a} / ${b}</span>`;
  }
  return "";
}

// context: 'display' | 'offer' | 'admin'
export function matchupCardHtml(m, opts = {}) {
  const { context = "display", events = [] } = opts;
  const aRec = `${m.a_wins}-${m.a_losses}-${m.a_draws}`;
  const bRec = `${m.b_wins}-${m.b_losses}-${m.b_draws}`;

  let footer = "";
  if (context === "offer") {
    footer = `
      <div class="mu-actions">
        <form method="POST" action="/matches/${m.id}/respond" style="display:inline">
          <input type="hidden" name="response" value="accepted">
          <button type="submit" class="btn btn-gold btn-small">✅ Accept Fight</button>
        </form>
        <form method="POST" action="/matches/${m.id}/respond" style="display:inline">
          <input type="hidden" name="response" value="declined">
          <button type="submit" class="btn btn-outline btn-small">Decline</button>
        </form>
      </div>`;
  } else if (context === "admin") {
    const evOptions = events
      .map((e) => `<option value="${e.id}" ${m.event_id === e.id ? "selected" : ""}>${escapeHtml(e.title)}</option>`)
      .join("");
    let adminControls = "";
    if (m.status === "agreed") {
      adminControls = `
        <form method="POST" action="/matches/${m.id}/confirm" class="mu-confirm-form">
          <select name="event_id"><option value="">Confirm (no card yet)</option>${evOptions}</select>
          <button type="submit" class="btn btn-gold btn-small">Confirm Bout</button>
        </form>`;
    } else if (m.status === "confirmed") {
      adminControls = `<span class="mu-placed">${m.event_title ? "On card: " + escapeHtml(m.event_title) : "Confirmed (no card)"}</span>
        <form method="POST" action="/matches/${m.id}/place" class="mu-confirm-form">
          <select name="event_id"><option value="">— no card —</option>${evOptions}</select>
          <button type="submit" class="btn btn-outline btn-small">Move</button>
        </form>`;
    }
    footer = `
      <div class="mu-actions">
        ${adminControls}
        <form method="POST" action="/matches/${m.id}/cancel" style="display:inline">
          <button type="submit" class="link-btn" style="color:#d98a8a">Cancel</button>
        </form>
      </div>`;
  } else if (context === "display" && m.event_title) {
    footer = `<div class="mu-actions"><span class="mu-placed">📅 ${escapeHtml(m.event_title)}</span></div>`;
  }

  return `
  <div class="matchup-card status-${m.status}">
    <div class="mu-body">
      ${sideHtml(m.fighter_a_id, m.a_name, aRec, m.a_division, m.a_type)}
      <div class="mu-vs">VS</div>
      ${sideHtml(m.fighter_b_id, m.b_name, bRec, m.b_division, m.b_type)}
    </div>
    <div class="mu-foot">
      ${matchStatusTag(m)}
      ${m.agreed_weight ? `<span class="mu-weight">⚖️ ${escapeHtml(m.agreed_weight)}</span>` : ""}
    </div>
    ${m.note ? `<p class="mu-note">${escapeHtml(m.note)}</p>` : ""}
    ${footer}
  </div>`;
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
export function dashboardPage({ fighter, isAdmin, fighterCount, eventCount, pendingOffers = [], bouts = [] }) {
  const firstName = fighter.full_name.split(" ")[0];

  const offersSection = pendingOffers.length
    ? `
      <div class="offers-banner">
        <div class="nsw-rule" style="justify-content:flex-start;margin:0 0 12px"><span></span>You have ${pendingOffers.length} fight offer${pendingOffers.length === 1 ? "" : "s"}<span></span></div>
        <p style="color:var(--grey);margin:0 0 16px">A matchmaker has offered you a fight. Review the opponent's record and accept or decline — nothing happens unless you agree.</p>
        <div class="matchup-list">
          ${pendingOffers.map((m) => matchupCardHtml(m, { context: "offer" })).join("")}
        </div>
      </div>`
    : "";

  const boutsSection = bouts.length
    ? `
      <div style="margin-top:34px">
        <div class="nsw-rule" style="justify-content:flex-start;margin:0 0 12px"><span></span>Your Bouts<span></span></div>
        <div class="matchup-list">
          ${bouts.map((m) => matchupCardHtml(m, { context: "display" })).join("")}
        </div>
      </div>`
    : "";

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

      ${offersSection}

      <div class="hub-grid">
        <a class="hub-tab" href="/fighters">
          <div class="hub-icon">🥊</div>
          <h2>Fighter Profiles</h2>
          <p>Browse every registered fighter, sorted into their weight division — real records, on show.</p>
          <span class="hub-count">${fighterCount} fighter${fighterCount === 1 ? "" : "s"}</span>
        </a>
        <a class="hub-tab" href="/events">
          <div class="hub-icon">📅</div>
          <h2>Event Nominations</h2>
          <p>See scheduled fight nights and nominate yourself — you're auto-listed in your weight class.</p>
          <span class="hub-count">${eventCount} event${eventCount === 1 ? "" : "s"}</span>
        </a>
        <a class="hub-tab" href="/confirmed">
          <div class="hub-icon">🤜🤛</div>
          <h2>Confirmed Matches</h2>
          <p>Locked bouts — both fighters agreed. See who's fighting who on every card.</p>
          <span class="hub-count">View bouts</span>
        </a>
        <a class="hub-tab" href="/points">
          <div class="hub-icon">🏆</div>
          <h2>Points &amp; Prizes</h2>
          <p>Season leaderboard — earn points every fight, win prizes on the night and all year.</p>
          <span class="hub-count">Leaderboard</span>
        </a>
        <a class="hub-tab" href="/fighters/${fighter.id}">
          <div class="hub-icon">👤</div>
          <h2>My Profile</h2>
          <p>View or edit your profile, record, title status and availability for offers.</p>
          <span class="hub-count">Edit anytime</span>
        </a>
        ${isAdmin ? `
        <a class="hub-tab hub-tab-admin" href="/matchmaking">
          <div class="hub-icon">🤝</div>
          <h2>Matchmaking</h2>
          <p>Admin: match two fighters, offer the fight, and confirm it once both agree.</p>
          <span class="hub-count">Admin only</span>
        </a>
        <a class="hub-tab hub-tab-admin" href="/events/new">
          <div class="hub-icon">➕</div>
          <h2>Create Fight Night</h2>
          <p>Admin: add a new fight night for fighters to nominate for.</p>
          <span class="hub-count">Admin only</span>
        </a>` : ""}
      </div>

      ${boutsSection}
    </div>
  </section>
  `;
}

// ---------- Matchmaking (admin) ----------
export function matchmakingPage({ pickerFighters, events, matches, error, success }) {
  const optionHtml = (f) =>
    `<option value="${f.id}" data-type="${f.boxer_type}" data-div="${escapeHtml(f.division_name || "")}">${escapeHtml(f.full_name)} (${f.wins}-${f.losses}-${f.draws}) — ${f.boxer_type === "professional" ? "Pro" : "Am"}${f.division_label ? " " + escapeHtml(f.division_label) : ""}</option>`;
  const options = pickerFighters.map(optionHtml).join("");
  const eventOptions = events.map((e) => `<option value="${e.id}">${escapeHtml(e.title)}</option>`).join("");

  const live = matches.filter((m) => m.status === "agreed" || m.status === "proposed");
  const confirmed = matches.filter((m) => m.status === "confirmed");

  return `
  <section class="section-tight">
    <div class="wrap">
      <a href="/" class="back-link">← Home</a>
      <h1 style="text-align:center">Matchmaking</h1>
      <p style="text-align:center;color:var(--grey);max-width:640px;margin:0 auto 6px">Match two fighters and offer them the fight. Both must accept before it can be confirmed — records are on the table, so every match is fair and agreed.</p>

      ${error ? `<div class="flash flash-error">${escapeHtml(error)}</div>` : ""}
      ${success ? `<div class="flash flash-success">${escapeHtml(success)}</div>` : ""}

      <div class="card form-card wide" style="margin-top:22px">
        <h3 style="text-align:center">Offer a New Fight</h3>
        <form method="POST" action="/matchmaking">
          <div class="field-row">
            <div class="field">
              <label for="fighter_a_id">Fighter A (Red Corner)</label>
              <select id="fighter_a_id" name="fighter_a_id" required><option value="">Select a fighter…</option>${options}</select>
            </div>
            <div class="field">
              <label for="fighter_b_id">Fighter B (Blue Corner)</label>
              <select id="fighter_b_id" name="fighter_b_id" required><option value="">Select a fighter…</option>${options}</select>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="agreed_weight">Agreed Weight (optional)</label>
              <input type="text" id="agreed_weight" name="agreed_weight" placeholder="e.g. 71kg catchweight">
            </div>
            <div class="field">
              <label for="event_id">Slot on Fight Night (optional)</label>
              <select id="event_id" name="event_id"><option value="">Decide later</option>${eventOptions}</select>
            </div>
          </div>
          <div class="field">
            <label for="note">Note to fighters (optional)</label>
            <input type="text" id="note" name="note" placeholder="e.g. 3x3 min, headguards, catchweight bout">
          </div>
          <button type="submit" class="btn btn-gold" style="width:100%">🤝 Send Fight Offer to Both</button>
        </form>
      </div>

      <div class="nsw-rule" style="margin:34px auto 18px"><span></span>Live Offers &amp; Agreed (${live.length})<span></span></div>
      ${live.length ? `<div class="matchup-list">${live.map((m) => matchupCardHtml(m, { context: "admin", events })).join("")}</div>` : `<div class="empty-state"><p>No open offers. Make a match above.</p></div>`}

      <div class="nsw-rule" style="margin:34px auto 18px"><span></span>Confirmed Bouts (${confirmed.length})<span></span></div>
      ${confirmed.length ? `<div class="matchup-list">${confirmed.map((m) => matchupCardHtml(m, { context: "admin", events })).join("")}</div>` : `<div class="empty-state"><p>No confirmed bouts yet.</p></div>`}
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

export function eventDetailPage({ event, nominees, myFighter, alreadyNominated, isAdmin, card = [] }) {
  let nomineeCards;
  if (!nominees.length) {
    nomineeCards = `<div class="empty-state"><p>No one has nominated yet. Be the first to put your hand up.</p></div>`;
  } else {
    // Auto-categorise nominees into their weight class so the matchmaker can pair like with like.
    const groups = new Map();
    for (const f of nominees) {
      const key = f.division_label || "Unlisted division";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(f);
    }
    nomineeCards = [...groups.entries()].map(([label, list]) => `
      <div class="weight-group">
        <div class="weight-group-head">
          <span>${escapeHtml(label)}</span>
          <span class="weight-group-count">${list.length} nominated</span>
        </div>
        <div class="roster-grid">${list.map(fighterCardHtml).join("")}</div>
      </div>`).join("");
  }

  const fightCard = `
      <div class="nsw-rule" style="margin:34px auto 20px"><span></span>The Card — Confirmed Bouts (${card.length})<span></span></div>
      ${card.length
        ? `<div class="matchup-list">${card.map((m) => matchupCardHtml(m, { context: "display" })).join("")}</div>`
        : `<div class="empty-state"><p>No bouts confirmed on this card yet. Agreed matchups appear here once locked in.</p></div>`}`;

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
        <p style="color:var(--grey);margin:0 0 12px">Want to fight on this card? Put your hand up — you'll be added to the nominated list and move straight into the Matching Pool.</p>
        <form method="POST" action="/events/${event.id}/nominate">
          <button type="submit" class="btn btn-gold btn-big">🥊 Nominate Here</button>
        </form>
      </div>`;
  }

  const videoBlock = event.video_path
    ? `<div class="event-video"><video controls preload="metadata" src="${escapeHtml(event.video_path)}" style="width:100%;border-radius:10px;margin-top:16px"></video></div>`
    : "";

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
      ${videoBlock}

      ${nominateBox}

      ${fightCard}

      <div class="nsw-rule" style="margin:34px auto 20px"><span></span>Nominated — Put Their Hand Up (${nominees.length})<span></span></div>
      ${nomineeCards}
    </div>
  </section>
  `;
}

// ---------- Matching Pool (tab 3) — everyone currently nominated, ready to be matched ----------
export function matchingPoolPage({ fighters, isAdmin }) {
  if (!fighters.length) {
    return `
    <section class="section">
      <div class="wrap">
        <a href="/" class="back-link">← Home</a>
        <h1 style="text-align:center">Matching Pool</h1>
        <div class="empty-state"><p>No one's nominated for a fight night yet. Once a fighter nominates, they land here ready to be matched.</p></div>
      </div>
    </section>`;
  }

  const groups = new Map();
  for (const f of fighters) {
    const key = f.division_label || "Unlisted division";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(f);
  }

  const groupHtml = [...groups.entries()].map(([label, list]) => `
    <div class="weight-group">
      <div class="weight-group-head">
        <span>${escapeHtml(label)}</span>
        <span class="weight-group-count">${list.length} in the pool</span>
      </div>
      <div class="roster-grid">
        ${list.map((f) => `
          <div class="fighter-cell">
            ${fighterCardHtml(f)}
            ${f.nominated_events.length ? `<p class="fighter-meta" style="text-align:center;margin-top:6px">📅 ${f.nominated_events.map(escapeHtml).join(", ")}</p>` : ""}
            ${isAdmin ? `<div style="text-align:center;margin-top:6px"><a href="/matchmaking?a=${f.id}" class="btn btn-outline btn-small">🥊 Offer a Match</a></div>` : ""}
          </div>`).join("")}
      </div>
    </div>`).join("");

  return `
  <section class="section-tight">
    <div class="wrap">
      <a href="/" class="back-link">← Home</a>
      <h1 style="text-align:center">Matching Pool</h1>
      <p style="text-align:center;color:var(--grey)">${fighters.length} fighter${fighters.length === 1 ? "" : "s"} nominated and ready to be matched, grouped by weight division.</p>
      ${groupHtml}
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
            <input type="text" id="title" name="title" value="${escapeHtml(values.title || "")}" placeholder="e.g. Prize Fighter NSW — Fight Night 1" required>
          </div>
          <div class="field">
            <label for="photo">Event Photo / Poster</label>
            <input type="file" id="photo" name="photo" accept="image/png,image/jpeg,image/webp" required>
            <p class="help-text">A poster or photo for the event. Shown across the top of the event.</p>
            <img id="photo-preview" src="" alt="Preview" style="display:none;margin-top:10px;max-width:100%;border-radius:8px;border:2px solid var(--gold-dark)">
          </div>
          <div class="field">
            <label for="video">Event Video (optional)</label>
            <input type="file" id="video" name="video" accept="video/mp4,video/quicktime,video/webm">
            <p class="help-text">Optional highlight reel, promo clip, or fight footage — shown on the event page under the poster.</p>
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

// ---------- Points / Leaderboard ----------
export function pointsPage({ leaderboard, season, myFighterId }) {
  const rows = leaderboard.length
    ? leaderboard.map((f, i) => `
      <div class="lb-row${i < 3 ? " top" : ""}">
        <div class="lb-rank">${i + 1}</div>
        <a class="lb-fighter" href="/fighters/${f.id}">
          <img src="/photo/${f.id}" alt="${escapeHtml(f.full_name)}" loading="lazy">
          <span>
            <span class="lb-name">${escapeHtml(f.full_name)}${f.id === myFighterId ? " (you)" : ""}</span><br>
            <span class="lb-meta">${escapeHtml(f.gym_name)} · ${f.fights} bout${f.fights === 1 ? "" : "s"}${f.fotn_count ? " · " + f.fotn_count + "× FOTN" : ""}</span>
          </span>
        </a>
        <div class="lb-points"><span class="n">${f.points}</span><span class="l">points</span></div>
      </div>`).join("")
    : `<div class="empty-state"><p>No points on the board yet. Points are awarded once fight results are recorded.</p></div>`;

  return `
  <section class="section-tight">
    <div class="wrap">
      <a href="/" class="back-link">← Home</a>
      <div class="points-hero">
        <h1>Points &amp; Prizes</h1>
        <p style="color:var(--grey);margin:0">${escapeHtml(String(season))} season · points build up across every Prize Fighter NSW event.</p>
      </div>
      <div class="points-rules">
        <span class="points-rule"><b>+1</b> for fighting</span>
        <span class="points-rule"><b>+2</b> for a win</span>
        <span class="points-rule"><b>+3</b> for a TKO/KO</span>
        <span class="points-rule"><b>+5</b> Fighter of the Night</span>
      </div>
      <p style="text-align:center;color:var(--grey);max-width:640px;margin:0 auto 24px">Prizes are won on the night at every event — and points stack up all year for the big season-end prizes. Climb the board.</p>
      <div class="leaderboard">${rows}</div>
    </div>
  </section>
  `;
}

// ---------- Confirmed matches (tab 3) ----------
function resultFormHtml(m) {
  if (m.result_recorded) {
    let txt;
    if (!m.winner_fighter_id) txt = "Draw";
    else {
      const wName = m.winner_fighter_id === m.fighter_a_id ? m.a_name : m.b_name;
      txt = `${escapeHtml(wName)} won${m.method ? " by " + escapeHtml(m.method) : ""}`;
    }
    return `<p class="result-recorded">✅ Result: ${txt}</p>`;
  }
  return `
    <form method="POST" action="/matches/${m.id}/result" class="result-form">
      <select name="winner_fighter_id" required>
        <option value="">Winner…</option>
        <option value="${m.fighter_a_id}">${escapeHtml(m.a_name)}</option>
        <option value="${m.fighter_b_id}">${escapeHtml(m.b_name)}</option>
        <option value="draw">Draw</option>
      </select>
      <select name="method">
        <option value="Decision">Decision</option>
        <option value="TKO/KO">TKO/KO</option>
      </select>
      <select name="fotn_fighter_id">
        <option value="">Fighter of the Night…</option>
        <option value="${m.fighter_a_id}">${escapeHtml(m.a_name)}</option>
        <option value="${m.fighter_b_id}">${escapeHtml(m.b_name)}</option>
      </select>
      <button type="submit" class="btn btn-gold btn-small">Record &amp; Award Points</button>
    </form>`;
}

export function confirmedPage({ matches, isAdmin }) {
  if (!matches.length) {
    return `
    <section class="section">
      <div class="wrap">
        <a href="/" class="back-link">← Home</a>
        <h1 style="text-align:center">Confirmed Matches</h1>
        <div class="empty-state"><p>No confirmed bouts yet. Once both fighters confirm a match, it lands here as a locked fight.</p></div>
      </div>
    </section>`;
  }
  const cards = matches.map((m) => `
    <div class="matchup-wrap">
      ${matchupCardHtml(m, { context: "display" })}
      ${isAdmin ? `<div style="margin-top:-8px">${resultFormHtml(m)}</div>` : (m.result_recorded ? `<div style="text-align:center">${resultFormHtml(m)}</div>` : "")}
    </div>`).join("");

  return `
  <section class="section-tight">
    <div class="wrap">
      <a href="/" class="back-link">← Home</a>
      <h1 style="text-align:center">Confirmed Matches</h1>
      <p style="text-align:center;color:var(--grey)">${matches.length} locked bout${matches.length === 1 ? "" : "s"} — both fighters agreed, fight confirmed.</p>
      <div class="matchup-list" style="margin-top:24px">${cards}</div>
    </div>
  </section>
  `;
}
