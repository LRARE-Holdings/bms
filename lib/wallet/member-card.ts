import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The member's check-in card for Apple/Google Wallet: the same personal
 * "forma-member:<checkin_token>" QR as the Check-in code page, so it works for
 * every class they book and at the studio's scanner without any change there.
 */
export interface WalletMemberCard {
  checkinToken: string;
  holderName: string;
  studioId: string;
  studioName: string;
  publicBaseUrl: string;
}

export async function loadWalletMemberCard(profileId: string, studioId: string): Promise<WalletMemberCard | null> {
  const supabase = createAdminClient();
  const { data: membership } = await supabase
    .from("studio_memberships")
    .select("checkin_token, profiles:profile_id(full_name), studios:studio_id(name, domain)")
    .eq("studio_id", studioId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!membership?.checkin_token) return null;

  const profile = membership.profiles as unknown as { full_name: string | null } | null;
  const studio = membership.studios as unknown as { name: string; domain: string | null } | null;

  return {
    checkinToken: membership.checkin_token as string,
    holderName: profile?.full_name || "Member",
    studioId,
    studioName: studio?.name ?? "Studio",
    publicBaseUrl: `https://${studio?.domain ?? "burnmatstudio.co.uk"}`,
  };
}

export function memberCardBarcode(card: WalletMemberCard): string {
  return `forma-member:${card.checkinToken}`;
}
