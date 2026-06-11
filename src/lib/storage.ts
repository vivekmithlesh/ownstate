// OwnState — Storage upload helpers (Brick 10)
//
// Client-side uploads using the browser Supabase client. Files are stored under
// "<userId>/<unique>.<ext>" so the storage RLS policies (supabase/storage.sql)
// allow each user to write only inside their own folder.

import { createClient } from "@/lib/supabase/client";

function uniquePath(userId: string, fileName: string): string {
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "bin";
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${userId}/${id}.${ext}`;
}

/** Upload a property photo to the public bucket; returns its public URL. */
export async function uploadPropertyImage(
  file: File,
  userId: string
): Promise<string> {
  const supabase = createClient();
  const path = uniquePath(userId, file.name);

  const { error } = await supabase.storage
    .from("property-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("property-images").getPublicUrl(path);
  return data.publicUrl;
}

/** Upload a document to the PRIVATE bucket; returns the storage path. */
export async function uploadDocument(
  file: File,
  userId: string
): Promise<string> {
  const supabase = createClient();
  const path = uniquePath(userId, file.name);

  const { error } = await supabase.storage
    .from("documents")
    .upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);

  return path;
}
