export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Bump this when static CSS/JS changes to bust browser caches.
const ASSET_VERSION = "6";

export function layout({ title, user, body, active }) {
  const nav = user
    ? [
        { href: "/", label: "Home", key: "home" },
        { href: "/fighters", label: "Fighter Profiles", key: "roster" },
        { href: "/events", label: "Fight Nights", key: "events" },
      ]
    : [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} | WARCHEST NSW</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/public/style.css?v=${ASSET_VERSION}">
<link rel="icon" href="/public/favicon-64.png" type="image/png" sizes="64x64">
<link rel="icon" href="/public/favicon-32.png" type="image/png" sizes="32x32">
<link rel="manifest" href="/public/manifest.json">
<link rel="apple-touch-icon" href="/public/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="WARCHEST">
<meta name="theme-color" content="#0a0a0a">
</head>
<body>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/">
      <img src="/public/logo.png" alt="WARCHEST NSW" class="brand-logo">
      <span class="brand-text">WARCHEST <span class="brand-nsw">NSW</span></span>
    </a>
    <nav class="main-nav">
      ${nav
        .map(
          (item) =>
            `<a href="${item.href}" class="${active === item.key ? "active" : ""}">${item.label}</a>`
        )
        .join("")}
      ${
        user
          ? `<a href="/me" class="${active === "me" ? "active" : ""}">My Profile</a>
             <form method="POST" action="/logout" class="inline-form"><button type="submit" class="link-btn">Log Out</button></form>`
          : `<a href="/login" class="${active === "login" ? "active" : ""}">Log In</a>
             <a href="/signup" class="btn btn-gold btn-small">Register</a>`
      }
    </nav>
  </div>
</header>
<main>
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <img src="/public/logo.png" alt="WARCHEST NSW" class="footer-logo">
    <p>WARCHEST NSW &mdash; earn your place, fight for the chest.</p>
  </div>
</footer>
<script src="/public/app.js?v=${ASSET_VERSION}"></script>
</body>
</html>`;
}

export function flashHtml(message, kind = "error") {
  if (!message) return "";
  return `<div class="flash flash-${kind}">${escapeHtml(message)}</div>`;
}
