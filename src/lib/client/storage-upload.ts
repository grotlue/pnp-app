import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

type StorageBucket = "profile-images" | "character-images";

type SignedImageUploadInput = {
  bucket: StorageBucket;
  path: string;
  token: string;
  file: File;
};

export async function uploadImageToSignedPath({
  bucket,
  path,
  token,
  file,
}: SignedImageUploadInput): Promise<void> {
  const supabase = getBrowserSupabaseClient();
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, file);

  if (error) {
    throw new Error(error.message);
  }
}
