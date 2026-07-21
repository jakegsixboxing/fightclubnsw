import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_DIMENSION = 1400;

export function isAllowedPhotoType(contentType) {
  return ALLOWED_TYPES.has((contentType || "").toLowerCase());
}

// Process an uploaded photo: auto-orient from EXIF, crop/resize to a
// consistent portrait frame, and save it to disk. Returns the stored
// filename (relative to /uploads).
export async function saveFighterPhoto(fighterId, buffer) {
  const filename = `fighter-${fighterId}.jpg`;
  const outPath = path.join(uploadsDir, filename);
  await sharp(buffer)
    .rotate() // auto-orient using EXIF data
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 88 })
    .toFile(outPath);
  return filename;
}

// Event banner photo: wide 16:9 crop, saved to disk. Returns stored filename.
export async function saveEventPhoto(eventId, buffer) {
  const filename = `event-${eventId}.jpg`;
  const outPath = path.join(uploadsDir, filename);
  await sharp(buffer)
    .rotate()
    .resize({ width: 1600, height: 900, fit: "cover", position: "attention" })
    .jpeg({ quality: 86 })
    .toFile(outPath);
  return filename;
}

export async function renderEventPhoto(filename) {
  const filePath = path.join(uploadsDir, filename);
  return sharp(filePath).jpeg({ quality: 86 }).toBuffer();
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Build an SVG "champion" ribbon banner sized to the image width, to be
// composited across the photo for current titleholders.
function buildRibbonSvg(width, height, text) {
  const bandHeight = Math.max(56, Math.round(height * 0.12));
  const y = Math.round(height * 0.66);
  // Fit the font to the banner width so longer titles (e.g. "FLYWEIGHT AUS CHAMPION") don't overflow.
  const byHeight = bandHeight * 0.46;
  const byWidth = (width * 0.92) / (text.length * 0.62);
  const fontSize = Math.max(18, Math.round(Math.min(byHeight, byWidth)));
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#8a6a1f"/>
          <stop offset="12%" stop-color="#e9c874"/>
          <stop offset="50%" stop-color="#fff3cf"/>
          <stop offset="88%" stop-color="#e9c874"/>
          <stop offset="100%" stop-color="#8a6a1f"/>
        </linearGradient>
      </defs>
      <rect x="0" y="${y}" width="${width}" height="${bandHeight}" fill="url(#gold)" stroke="#151515" stroke-width="3"/>
      <rect x="0" y="${y}" width="${width}" height="4" fill="#151515" opacity="0.35"/>
      <rect x="0" y="${y + bandHeight - 4}" width="${width}" height="4" fill="#151515" opacity="0.35"/>
      <text x="50%" y="${y + bandHeight / 2}" dominant-baseline="middle" text-anchor="middle"
            font-family="'Arial Black', Arial, sans-serif" font-weight="900"
            font-size="${fontSize}" letter-spacing="${Math.round(fontSize * 0.12)}"
            fill="#1a1a1a">${escapeXml(text)}</text>
    </svg>
  `);
}

// Returns a Buffer (JPEG) of the fighter's photo, with the champion ribbon
// composited on top if `overlayText` is provided. Computed on the fly so the
// banner always reflects current title status without needing to regenerate
// stored files when a title changes.
export async function renderFighterPhoto(filename, overlayText) {
  const filePath = path.join(uploadsDir, filename);
  const image = sharp(filePath);
  const meta = await image.metadata();
  const width = meta.width || 800;
  const height = meta.height || 800;

  if (!overlayText) {
    return image.jpeg({ quality: 88 }).toBuffer();
  }

  const ribbon = buildRibbonSvg(width, height, overlayText);
  return image
    .composite([{ input: ribbon, top: 0, left: 0 }])
    .jpeg({ quality: 88 })
    .toBuffer();
}

export function photoExists(filename) {
  if (!filename) return false;
  return fs.existsSync(path.join(uploadsDir, filename));
}

export { uploadsDir };
