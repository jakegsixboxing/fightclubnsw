// Helpers for turning a fighter's title fields into display text.

// Short level tag used in the photo banner (e.g. "NSW", "AUS").
export function titleLevelShort(fighter) {
  if (fighter.title_level === "nsw") return "NSW";
  if (fighter.title_level === "australian") return "AUS";
  if (fighter.title_level === "regional") return (fighter.title_region || "Regional").toUpperCase();
  return null;
}

export function titleLevelLabel(fighter) {
  if (fighter.title_level === "nsw") return "NSW";
  if (fighter.title_level === "australian") return "Australian";
  if (fighter.title_level === "regional") {
    return fighter.title_region ? `${fighter.title_region} Regional` : "Regional";
  }
  return null;
}

// Badge / bio text, e.g. "Flyweight NSW Champion" or "Flyweight Australian Former Champion".
export function titleBadgeText(fighter) {
  if (!fighter.has_title) return null;
  const level = titleLevelLabel(fighter);
  if (!level) return null;
  const division = fighter.division_name || fighter.division_label || "";
  const div = division ? `${String(division).replace(/\s*\([^)]*\)\s*/, "").trim()} ` : "";
  const status = fighter.title_current ? "Champion" : "Former Champion";
  return `${div}${level} ${status}`.trim();
}

// The gold/red banner slashed across a current champion's photo,
// e.g. "FLYWEIGHT AUS CHAMPION". Pass the division name in when available.
export function titleOverlayText(fighter, divisionName) {
  if (!fighter.has_title || !fighter.title_current) return null;
  const short = titleLevelShort(fighter);
  if (!short) return null;
  const div = (divisionName || fighter.division_name || "").replace(/\s*\([^)]*\)\s*/, "").trim();
  return `${div ? div.toUpperCase() + " " : ""}${short} CHAMPION`;
}
