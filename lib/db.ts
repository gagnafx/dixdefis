import { neon } from "@neondatabase/serverless";

type NeonClient = ReturnType<typeof neon>;

let client: NeonClient | null = null;
let schemaPromise: Promise<void> | null = null;

export function getDb(): NeonClient {
  if (!client) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is missing. Add your Neon connection string to the environment.");
    }
    client = neon(databaseUrl);
  }

  return client;
}

export async function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    const sql = getDb();
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS user_account (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          togo_market_balance INTEGER NOT NULL DEFAULT 0 CHECK (togo_market_balance >= 0),
          weekly_earnings INTEGER NOT NULL DEFAULT 0 CHECK (weekly_earnings >= 0),
          last_transfer_date DATE,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS challenges (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          reward_fcfa INTEGER NOT NULL CHECK (reward_fcfa >= 0),
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        INSERT INTO user_account (id)
        VALUES (1)
        ON CONFLICT (id) DO NOTHING
      `;
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  await schemaPromise;
}