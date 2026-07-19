// Weight divisions used at Fight Club NSW fight nights.
// Amateur divisions: Boxing Australia / Australian Amateur Boxing League standard (14 divisions).
// Professional divisions: standard world professional boxing weight classes (17 divisions).

export const AMATEUR_DIVISIONS = [
  { name: "Light Fly", label: "Light Fly (up to 48kg)", minKg: 0, maxKg: 48 },
  { name: "Fly", label: "Fly (48-51kg)", minKg: 48, maxKg: 51 },
  { name: "Bantam", label: "Bantam (51-54kg)", minKg: 51, maxKg: 54 },
  { name: "Feather", label: "Feather (54-57kg)", minKg: 54, maxKg: 57 },
  { name: "Light", label: "Light (57-60kg)", minKg: 57, maxKg: 60 },
  { name: "Junior Welter", label: "Junior Welter (60-63.5kg)", minKg: 60, maxKg: 63.5 },
  { name: "Welter", label: "Welter (63.5-67kg)", minKg: 63.5, maxKg: 67 },
  { name: "Light Middle", label: "Light Middle (67-71kg)", minKg: 67, maxKg: 71 },
  { name: "Middle", label: "Middle (71-75kg)", minKg: 71, maxKg: 75 },
  { name: "Super Middle", label: "Super Middle (75-78kg)", minKg: 75, maxKg: 78 },
  { name: "Light Heavy", label: "Light Heavy (78-81kg)", minKg: 78, maxKg: 81 },
  { name: "Cruiser", label: "Cruiser (81-86kg)", minKg: 81, maxKg: 86 },
  { name: "Heavy", label: "Heavy (86-91kg)", minKg: 86, maxKg: 91 },
  { name: "Super Heavy", label: "Super Heavy (91kg+)", minKg: 91, maxKg: null },
];

export const PRO_DIVISIONS = [
  { name: "Strawweight", label: "Strawweight (up to 47.6kg)", minKg: 0, maxKg: 47.6 },
  { name: "Light Flyweight", label: "Light Flyweight (up to 49.0kg)", minKg: 47.6, maxKg: 49.0 },
  { name: "Flyweight", label: "Flyweight (up to 50.8kg)", minKg: 49.0, maxKg: 50.8 },
  { name: "Super Flyweight", label: "Super Flyweight (up to 52.2kg)", minKg: 50.8, maxKg: 52.2 },
  { name: "Bantamweight", label: "Bantamweight (up to 53.5kg)", minKg: 52.2, maxKg: 53.5 },
  { name: "Super Bantamweight", label: "Super Bantamweight (up to 55.3kg)", minKg: 53.5, maxKg: 55.3 },
  { name: "Featherweight", label: "Featherweight (up to 57.2kg)", minKg: 55.3, maxKg: 57.2 },
  { name: "Super Featherweight", label: "Super Featherweight (up to 59.0kg)", minKg: 57.2, maxKg: 59.0 },
  { name: "Lightweight", label: "Lightweight (up to 61.2kg)", minKg: 59.0, maxKg: 61.2 },
  { name: "Super Lightweight", label: "Super Lightweight (up to 63.5kg)", minKg: 61.2, maxKg: 63.5 },
  { name: "Welterweight", label: "Welterweight (up to 66.7kg)", minKg: 63.5, maxKg: 66.7 },
  { name: "Super Welterweight", label: "Super Welterweight (up to 69.9kg)", minKg: 66.7, maxKg: 69.9 },
  { name: "Middleweight", label: "Middleweight (up to 72.6kg)", minKg: 69.9, maxKg: 72.6 },
  { name: "Super Middleweight", label: "Super Middleweight (up to 76.2kg)", minKg: 72.6, maxKg: 76.2 },
  { name: "Light Heavyweight", label: "Light Heavyweight (up to 79.4kg)", minKg: 76.2, maxKg: 79.4 },
  { name: "Cruiserweight", label: "Cruiserweight (up to 90.7kg)", minKg: 79.4, maxKg: 90.7 },
  { name: "Heavyweight", label: "Heavyweight (unlimited)", minKg: 90.7, maxKg: null },
];
