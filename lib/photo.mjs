// Fighter/event photos are processed with sharp then uploaded straight to
// Supabase Storage (bucket "pf-photos"), so nothing lives on Render's
// ephemeral local disk. photo_path stores the full public URL.
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "pf-photos";
const MAX_DIMENSION = 1400;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isAllowedPhotoType(contentType) {
  return ALLOWED_TYPES.has((contentType || "").toLowerCase());
}

async function upload(objectPath, buffer) {
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, buffer, {
    contentType: "image/jpeg",
    upsert: true,
    cacheControl: "300",
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return `${data.publicUrl}?v=${Date.now()}`;
}

// Process an uploaded fighter photo: auto-orient from EXIF, cap dimensions,
// upload to Supabase Storage. Returns the public URL.
export async function saveFighterPhoto(fighterId, buffer) {
  const processed = await sharp(buffer)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toBuffer();
  return upload(`fighters/fighter-${fighterId}.jpg`, processed);
}

// Event banner photo: wide 16:9 crop, uploaded to Supabase Storage.
export async function saveEventPhoto(eventId, buffer) {
  const processed = await sharp(buffer)
    .rotate()
    .resize({ width: 1600, height: 900, fit: "cover", position: "attention" })
    .jpeg({ quality: 86 })
    .toBuffer();
  return upload(`events/event-${eventId}.jpg`, processed);
}
