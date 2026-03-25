import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parse } from "csv-parse/sync";

// ── Constants ────────────────────────────────────────────────────────────────

const STUDIO_ID = "f47b1352-b1bb-4a36-a601-ebf08030e26a";
const DRY_RUN = process.argv.includes("--dry-run");
const CREDITS_PER_PACK = 5;

const CLIENTS_CSV = resolve(__dirname, "../data/clients.csv");
const MEMBERSHIPS_CSV = resolve(__dirname, "../data/memberships.csv");

// ── Types ────────────────────────────────────────────────────────────────────

interface ClientRow {
  "Full Name": string;
  Email: string;
  "Date of birth": string;
  "Is Active": string;
}

interface MembershipRow {
  "Customer Name": string;
  "Customer Email": string;
  "Membership Name": string;
  Status: string;
  "Purchase Date": string;
  "Start Date": string;
  "Expiration Date": string;
}

interface MigrationUser {
  fullName: string;
  email: string;
  dateOfBirth: string | null;
  activePacks: Array<{
    membershipName: string;
    purchaseDate: string;
    expirationDate: string;
  }>;
}

interface MigrationResults {
  created: number;
  skipped: number;
  failed: number;
  membershipsCreated: number;
  packsCreated: number;
  errors: Array<{ email: string; error: string }>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Strip BOM and normalise CSV, then parse */
function parseCsv<T>(filePath: string): T[] {
  let raw = readFileSync(filePath, "utf-8");
  // Remove BOM
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as T[];
}

/** Parse date from YYYY-MM-DD or DD/MM/YYYY into ISO YYYY-MM-DD */
function parseDate(raw: string): string | null {
  if (!raw || raw.trim() === "") return null;
  const trimmed = raw.trim();

  // ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // UK: DD/MM/YYYY
  const ukMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukMatch) {
    const [, day, month, year] = ukMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(DRY_RUN ? "\n=== DRY RUN MODE ===" : "\n=== LIVE MIGRATION ===");
  console.log(`Studio ID: ${STUDIO_ID}\n`);

  // ── Step 1: Parse CSVs ──────────────────────────────────────────────────

  console.log("Parsing CSVs...");
  const clientRows = parseCsv<ClientRow>(CLIENTS_CSV);
  const membershipRows = parseCsv<MembershipRow>(MEMBERSHIPS_CSV);
  console.log(`  Clients CSV: ${clientRows.length} rows`);
  console.log(`  Memberships CSV: ${membershipRows.length} rows`);

  // ── Step 2: Filter active clients ───────────────────────────────────────

  const activeClients = clientRows.filter(
    (r) => r["Is Active"]?.trim().toLowerCase() === "yes"
  );
  console.log(`  Active clients: ${activeClients.length}`);

  // ── Step 3: Index active membership packs by email ──────────────────────

  const now = new Date();
  const activeMembershipsByEmail = new Map<
    string,
    MigrationUser["activePacks"]
  >();

  for (const row of membershipRows) {
    if (row.Status?.trim().toLowerCase() !== "active") continue;

    const expDate = parseDate(row["Expiration Date"]);
    if (!expDate) continue;
    if (new Date(expDate + "T23:59:59Z") <= now) continue;

    const email = row["Customer Email"]?.trim().toLowerCase();
    if (!email) continue;

    const existing = activeMembershipsByEmail.get(email) || [];
    existing.push({
      membershipName: row["Membership Name"],
      purchaseDate: parseDate(row["Purchase Date"]) || row["Purchase Date"],
      expirationDate: expDate,
    });
    activeMembershipsByEmail.set(email, existing);
  }

  console.log(
    `  Users with active packs: ${activeMembershipsByEmail.size}`
  );

  // ── Step 4: Build migration user list ───────────────────────────────────

  const migrationUsers: MigrationUser[] = activeClients.map((client) => {
    const email = client.Email?.trim().toLowerCase();
    return {
      fullName: client["Full Name"]?.trim() || "",
      email,
      dateOfBirth: parseDate(client["Date of birth"]) || parseDate(client["Date of Birth" as keyof ClientRow] as string),
      activePacks: activeMembershipsByEmail.get(email) || [],
    };
  });

  const usersWithPacks = migrationUsers.filter((u) => u.activePacks.length > 0);
  console.log(`\nMigration list: ${migrationUsers.length} users`);
  console.log(`  With active packs: ${usersWithPacks.length}`);
  console.log(
    `  Total pack rows to create: ${usersWithPacks.reduce((sum, u) => sum + u.activePacks.length, 0)}`
  );

  if (DRY_RUN) {
    console.log("\n--- Dry Run User List ---");
    for (const user of migrationUsers) {
      const packInfo =
        user.activePacks.length > 0
          ? ` [${user.activePacks.length} active pack(s): ${user.activePacks.map((p) => `expires ${p.expirationDate}`).join(", ")}]`
          : "";
      console.log(
        `  ${user.fullName} <${user.email}> DOB: ${user.dateOfBirth || "N/A"}${packInfo}`
      );
    }
    console.log("\n=== DRY RUN COMPLETE — no changes made ===");
    return;
  }

  // ── Step 5: Pre-load existing emails ────────────────────────────────────

  console.log("\nLoading existing profiles...");
  const { data: existingProfiles } = await supabase
    .from("profiles")
    .select("id, email");
  const existingEmails = new Set(
    existingProfiles?.map((p) => p.email?.toLowerCase()) ?? []
  );
  console.log(`  Existing profiles: ${existingEmails.size}`);

  // ── Step 6: Process each user ───────────────────────────────────────────

  const results: MigrationResults = {
    created: 0,
    skipped: 0,
    failed: 0,
    membershipsCreated: 0,
    packsCreated: 0,
    errors: [],
  };

  for (let i = 0; i < migrationUsers.length; i++) {
    const user = migrationUsers[i];
    const progress = `[${i + 1}/${migrationUsers.length}]`;

    // Skip existing
    if (existingEmails.has(user.email)) {
      console.log(`${progress} SKIP (exists): ${user.email}`);
      results.skipped++;
      continue;
    }

    try {
      // Step A: Create auth user
      // The DB trigger automatically creates the profile AND studio_membership
      // when studio_id is in user_metadata
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: user.email,
          email_confirm: true,
          user_metadata: {
            full_name: user.fullName,
            studio_id: STUDIO_ID,
            date_of_birth: user.dateOfBirth,
            migrated: true,
            migrated_at: new Date().toISOString(),
          },
        });

      if (authError) {
        // Check for duplicate — treat as skip
        if (
          authError.message?.includes("already been registered") ||
          authError.message?.includes("already exists")
        ) {
          console.log(`${progress} SKIP (auth exists): ${user.email}`);
          results.skipped++;
          existingEmails.add(user.email);
          continue;
        }
        throw new Error(`Auth: ${authError.message}`);
      }

      if (!authData?.user) {
        throw new Error("Auth: no user returned");
      }

      const userId = authData.user.id;
      results.created++;
      results.membershipsCreated++; // trigger handles this

      // Step B: Update profile with date_of_birth
      if (user.dateOfBirth) {
        await supabase
          .from("profiles")
          .update({ date_of_birth: user.dateOfBirth })
          .eq("id", userId);
      }

      // Step C: Create class_packs for active memberships
      for (const pack of user.activePacks) {
        const { error: packError } = await supabase
          .from("class_packs")
          .insert({
            studio_id: STUDIO_ID,
            profile_id: userId,
            pack_type: "5",
            credits_total: CREDITS_PER_PACK,
            credits_remaining: CREDITS_PER_PACK,
            purchased_at: pack.purchaseDate
              ? new Date(pack.purchaseDate + "T00:00:00Z").toISOString()
              : new Date().toISOString(),
            expires_at: new Date(
              pack.expirationDate + "T23:59:59Z"
            ).toISOString(),
            stripe_session_id: `migrated_${Date.now()}`,
          });

        if (packError) {
          console.error(
            `${progress} WARN: pack insert failed for ${user.email}: ${packError.message}`
          );
        } else {
          results.packsCreated++;
        }
      }

      const packNote =
        user.activePacks.length > 0
          ? ` + ${user.activePacks.length} pack(s)`
          : "";
      console.log(`${progress} CREATED: ${user.email}${packNote}`);

      // Add to existing set to prevent re-processing on re-run
      existingEmails.add(user.email);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`${progress} FAILED: ${user.email} — ${message}`);
      results.failed++;
      results.errors.push({ email: user.email, error: message });
    }

    // Rate limit: 100ms between users
    await sleep(100);
  }

  // ── Step 7: Summary ─────────────────────────────────────────────────────

  console.log("\n=== Migration Summary ===");
  console.log(`Users created:         ${results.created}`);
  console.log(`Users skipped:         ${results.skipped}`);
  console.log(`Users failed:          ${results.failed}`);
  console.log(`Memberships created:   ${results.membershipsCreated} (via DB trigger)`);
  console.log(`Class packs created:   ${results.packsCreated}`);

  if (results.errors.length > 0) {
    console.log("\nFailed users:");
    for (const e of results.errors) {
      console.log(`  ${e.email}: ${e.error}`);
    }
  }

  console.log("\n=== DONE ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
