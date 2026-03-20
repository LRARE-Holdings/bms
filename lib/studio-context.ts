import { headers } from "next/headers";

export async function getStudioId(): Promise<string> {
  if (process.env.NEXT_PUBLIC_STUDIO_ID) {
    return process.env.NEXT_PUBLIC_STUDIO_ID;
  }

  const h = await headers();
  const studioId = h.get("x-studio-id");
  if (!studioId)
    throw new Error("No studio context — x-studio-id header missing");
  return studioId;
}
