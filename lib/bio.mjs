import { titleBadgeText } from "./titles.mjs";

// Builds the auto-generated bio paragraph shown on a fighter's profile.
// Always folds in gym name + location (town/postcode) as required.
export function buildBio(fighter, weightDivision) {
  const parts = [];

  parts.push(
    `Fighting out of ${fighter.gym_name} in ${fighter.gym_town} NSW ${fighter.gym_postcode}, under coach ${fighter.coach_name}.`
  );

  const typeLabel = fighter.boxer_type === "professional" ? "professional" : "amateur";
  const divisionText = weightDivision ? ` at ${weightDivision.label}` : "";
  parts.push(`Competing as a ${typeLabel} boxer${divisionText}.`);

  const badge = titleBadgeText(fighter);
  if (badge) {
    parts.push(`${badge}.`);
  }

  return parts.join(" ");
}
