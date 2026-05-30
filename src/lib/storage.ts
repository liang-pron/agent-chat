/**
 * Avatar storage abstraction.
 * - Local dev: saves to public/avatars/, served as static files
 * - Production: uploads to Supabase Storage
 */
import { createClient } from "@supabase/supabase-js";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "仅支持 PNG、JPEG、GIF、WebP、SVG 格式";
  }
  if (file.size > MAX_SIZE) {
    return "文件大小不能超过 2MB";
  }
  return null;
}

/** Upload a file and return the public URL */
export async function uploadAvatar(file: File): Promise<string> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    // Production: Supabase Storage
    return uploadToSupabase(file, supabaseUrl, supabaseKey);
  }

  // Local dev: save to filesystem
  return uploadToLocal(file);
}

async function uploadToSupabase(
  file: File,
  url: string,
  key: string
): Promise<string> {
  const supabase = createClient(url, key);
  const ext = file.name.split(".").pop() || "png";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

async function uploadToLocal(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const avatarsDir = path.join(process.cwd(), "public", "avatars");

  await mkdir(avatarsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(avatarsDir, filename), buffer);

  return `/avatars/${filename}`;
}
