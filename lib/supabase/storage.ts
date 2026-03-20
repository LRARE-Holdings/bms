/**
 * Supabase Storage helpers
 *
 * Builds public URLs for files stored in Supabase Storage buckets.
 * Bucket policies must allow public reads for these URLs to work.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Returns the public URL for a file in a Supabase Storage bucket.
 *
 * @param bucket  – Storage bucket name (e.g. "instructors")
 * @param path    – File path within the bucket (e.g. "lucy.png")
 */
export function getStorageUrl(bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Convenience helper for instructor photos.
 * Returns the public URL if a photo_url is set, otherwise null.
 *
 * Handles two formats:
 *  - Full URL (already a complete Supabase storage URL) → returned as-is
 *  - Bare filename (e.g. "lucy.png") → prefixed with the storage bucket URL
 */
export function getInstructorPhotoUrl(
  photoUrl: string | null
): string | null {
  if (!photoUrl) return null;
  // If the value is already a full URL, return it directly
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl;
  }
  return getStorageUrl("instructors", photoUrl);
}
