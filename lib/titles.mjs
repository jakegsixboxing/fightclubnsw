// Helpers for turning a fighter's title fields into display text.

export function titleLevelLabel(fighter) {
  if (fighter.title_level === "nsw") return "NSW";
  if (fighter.title_level === "australian") return "Australian";
  if (fighter.title_level === "regional") {
    return fighter.title_region ? `${fighter.title_region} Regional` : "Regional";
  }
  return null;
}

export function titleBadgeText(fighter) {
  if (!fighter.has_title) return null;
  const level = titleLevelLabel(fighter);
  if (!level) return null;
  const status = fighter.title_current ? "Champion" : "Former Champion";
  return `${level} ${status}`;
}

export function titleOverlayText(fighter) {
  if (!fighter.has_title || !fighter.title_current) return null;
  const level = titleLevelLabel(fighter);
  if (!level) return null;
  return `${level.toUpperCase()} CHAMPION`;
}
