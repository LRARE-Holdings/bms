import { createSign } from "node:crypto";
import { ticketBarcode, ticketReference, type WalletTicket } from "@/lib/wallet/ticket";

/**
 * Google Wallet "Save to Google Wallet" links for event tickets.
 *
 * The event (a class) and the ticket (an object) travel inside a JWT signed
 * with the Google Wallet service account's key, so nothing has to be created
 * through Google's API ahead of time. Google creates both on first save; a
 * class that already exists is not updated by later saves.
 *
 * Needs: the issuer id from the Google Pay & Wallet Console, and a service
 * account (email + PEM private key) that has been given access to the issuer.
 */

function privateKey(): string | null {
  const value = process.env.GOOGLE_WALLET_PRIVATE_KEY;
  return value ? value.replace(/\\n/g, "\n") : null;
}

export function googleWalletConfigured(): boolean {
  return !!(
    process.env.GOOGLE_WALLET_ISSUER_ID &&
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL &&
    privateKey()
  );
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function localised(value: string) {
  return { defaultValue: { language: "en-GB", value } };
}

export function buildGoogleSaveUrl(ticket: WalletTicket): string {
  const issuer = process.env.GOOGLE_WALLET_ISSUER_ID!;
  const classId = `${issuer}.event-${ticket.eventId}`;

  const eventClass = {
    id: classId,
    issuerName: ticket.studioName,
    reviewStatus: "UNDER_REVIEW",
    eventName: localised(ticket.eventTitle),
    dateTime: { start: ticket.starts.toISOString(), end: ticket.ends.toISOString() },
    logo: {
      sourceUri: { uri: `${ticket.publicBaseUrl}/Logo_Beige.png` },
      contentDescription: localised(ticket.studioName),
    },
    hexBackgroundColor: "#473728",
  };

  const ticketObject = {
    id: `${issuer}.ticket-${ticket.ticketId}`,
    classId,
    state: "ACTIVE",
    ticketHolderName: ticket.holderName,
    ticketNumber: ticketReference(ticket.ticketId),
    barcode: {
      type: "QR_CODE",
      value: ticketBarcode(ticket.ticketId),
      alternateText: ticketReference(ticket.ticketId),
    },
    textModulesData: [
      { id: "tickets", header: "Tickets", body: String(ticket.quantity) },
      {
        id: "when",
        header: "When",
        body: ticket.timeDisplay ? `${ticket.dateDisplay}, ${ticket.timeDisplay}` : ticket.dateDisplay,
      },
      { id: "where", header: "Where", body: ticket.location ?? ticket.studioName },
    ],
    linksModuleData: {
      uris: [
        {
          id: "cancel",
          uri: `${ticket.publicBaseUrl}/account/events`,
          description: "Manage or cancel your tickets",
        },
      ],
    },
  };

  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: [ticket.publicBaseUrl],
    payload: { eventTicketClasses: [eventClass], eventTicketObjects: [ticketObject] },
  };

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(privateKey()!);
  return `https://pay.google.com/gp/v/save/${unsigned}.${base64url(signature)}`;
}
