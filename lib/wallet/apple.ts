import { readFile } from "node:fs/promises";
import path from "node:path";
import { PKPass } from "passkit-generator";
import { ticketBarcode, ticketReference, type WalletTicket } from "@/lib/wallet/ticket";
import { memberCardBarcode, type WalletMemberCard } from "@/lib/wallet/member-card";

/**
 * Apple Wallet passes (.pkpass): event tickets, and the member check-in card.
 *
 * Needs, from the Apple Developer account: a Pass Type ID, its signing
 * certificate and private key, and Apple's WWDR intermediate certificate — all
 * as PEM text in env vars (literal "\n" sequences are accepted).
 */

const ASSETS_DIR = path.join(process.cwd(), "wallet", "apple");
const ASSET_FILES = ["icon.png", "icon@2x.png", "icon@3x.png", "logo.png", "logo@2x.png", "logo@3x.png"];

function pem(name: string): string | null {
  const value = process.env[name];
  return value ? value.replace(/\\n/g, "\n") : null;
}

export function appleWalletConfigured(): boolean {
  return !!(
    process.env.APPLE_WALLET_PASS_TYPE_ID &&
    process.env.APPLE_WALLET_TEAM_ID &&
    pem("APPLE_WALLET_SIGNER_CERT") &&
    pem("APPLE_WALLET_SIGNER_KEY") &&
    pem("APPLE_WALLET_WWDR_CERT")
  );
}

/** Sign a pass.json with the studio's icons into a .pkpass. */
async function signPass(passJson: object): Promise<Buffer> {
  const buffers: Record<string, Buffer> = {};
  for (const file of ASSET_FILES) {
    buffers[file] = await readFile(path.join(ASSETS_DIR, file));
  }
  buffers["pass.json"] = Buffer.from(JSON.stringify(passJson));

  const pass = new PKPass(buffers, {
    wwdr: pem("APPLE_WALLET_WWDR_CERT")!,
    signerCert: pem("APPLE_WALLET_SIGNER_CERT")!,
    signerKey: pem("APPLE_WALLET_SIGNER_KEY")!,
    signerKeyPassphrase: process.env.APPLE_WALLET_SIGNER_KEY_PASSPHRASE || undefined,
  });

  return pass.getAsBuffer();
}

const COLOURS = {
  backgroundColor: "rgb(71, 55, 40)",
  foregroundColor: "rgb(245, 240, 232)",
  labelColor: "rgb(196, 169, 90)",
};

export async function buildApplePass(ticket: WalletTicket): Promise<Buffer> {
  const cancelUrl = `${ticket.publicBaseUrl}/account/events`;

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: process.env.APPLE_WALLET_PASS_TYPE_ID,
    teamIdentifier: process.env.APPLE_WALLET_TEAM_ID,
    serialNumber: ticket.ticketId,
    organizationName: ticket.studioName,
    description: `Ticket for ${ticket.eventTitle}`,
    ...COLOURS,
    sharingProhibited: true,
    // Shows the pass on the lock screen as the event approaches, and greys it
    // out once the event is over.
    relevantDate: ticket.starts.toISOString(),
    expirationDate: ticket.ends.toISOString(),
    barcodes: [
      {
        format: "PKBarcodeFormatQR",
        message: ticketBarcode(ticket.ticketId),
        messageEncoding: "iso-8859-1",
        altText: ticketReference(ticket.ticketId),
      },
    ],
    eventTicket: {
      headerFields: [
        { key: "tickets", label: "TICKETS", value: String(ticket.quantity) },
      ],
      primaryFields: [{ key: "event", label: "EVENT", value: ticket.eventTitle }],
      secondaryFields: [
        { key: "date", label: "DATE", value: ticket.dateDisplay },
        ...(ticket.timeDisplay ? [{ key: "time", label: "TIME", value: ticket.timeDisplay }] : []),
      ],
      auxiliaryFields: [
        { key: "name", label: "NAME", value: ticket.holderName },
        { key: "where", label: "WHERE", value: ticket.location ?? ticket.studioName },
      ],
      backFields: [
        ...(ticket.description
          ? [{ key: "about", label: "About this event", value: ticket.description }]
          : []),
        {
          key: "cancel",
          label: "Need to cancel?",
          value: `Cancel from My events any time before the event starts for a full refund: ${cancelUrl}`,
        },
        { key: "ref", label: "Ticket reference", value: ticketReference(ticket.ticketId) },
      ],
    },
  };
  return signPass(passJson);
}

/**
 * The member's check-in card. Its serial is the check-in token, so adding it
 * again replaces the card already in Wallet rather than adding a second one.
 */
export async function buildAppleMemberPass(card: WalletMemberCard): Promise<Buffer> {
  return signPass({
    formatVersion: 1,
    passTypeIdentifier: process.env.APPLE_WALLET_PASS_TYPE_ID,
    teamIdentifier: process.env.APPLE_WALLET_TEAM_ID,
    serialNumber: `member-${card.checkinToken}`,
    organizationName: card.studioName,
    description: `${card.studioName} check-in card`,
    ...COLOURS,
    sharingProhibited: true,
    barcodes: [
      {
        format: "PKBarcodeFormatQR",
        message: memberCardBarcode(card),
        messageEncoding: "iso-8859-1",
      },
    ],
    generic: {
      primaryFields: [{ key: "name", label: "MEMBER", value: card.holderName }],
      secondaryFields: [{ key: "studio", label: "STUDIO", value: card.studioName }],
      backFields: [
        {
          key: "how",
          label: "Checking in",
          value: "Show this code to your instructor when you arrive and they'll tick you in for the class you've booked. It works for every class.",
        },
        { key: "bookings", label: "Your bookings", value: `${card.publicBaseUrl}/account` },
      ],
    },
  });
}
