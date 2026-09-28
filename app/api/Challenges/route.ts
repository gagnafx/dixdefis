import { NextResponse } from "next/server";
import { ensureSchema, getDb } from "@/lib/db";
import { CHALLENGE_SEEDS } from "@/lib/challenges";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AccountRow = {
  togo_market_balance: number;
  weekly_earnings: number;
  last_transfer_date: string | null;
};

type SqlRow = Record<string, unknown>;

function rowsOf<T extends SqlRow>(result: unknown) {
  return result as T[];
}

async function seedChallenges(sql: ReturnType<typeof getDb>) {
  for (const challenge of CHALLENGE_SEEDS) {
    await sql`
      INSERT INTO challenges (id, title, reward_fcfa)
      VALUES (${challenge.id}, ${challenge.title}, ${challenge.rewardFcfa})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        reward_fcfa = EXCLUDED.reward_fcfa
    `;
  }
}

async function settleMonthlyTransfer(sql: ReturnType<typeof getDb>) {
  const rows = rowsOf<{ amount?: number }>(await sql`
    WITH due AS (
      SELECT id, weekly_earnings AS amount
      FROM user_account
      WHERE id = 1
        AND EXTRACT(DAY FROM CURRENT_DATE) = 1
        AND weekly_earnings > 0
        AND (
          last_transfer_date IS NULL
          OR EXTRACT(YEAR FROM last_transfer_date) <> EXTRACT(YEAR FROM CURRENT_DATE)
          OR EXTRACT(MONTH FROM last_transfer_date) <> EXTRACT(MONTH FROM CURRENT_DATE)
        )
    )
    UPDATE user_account AS account
    SET
      togo_market_balance = account.togo_market_balance + due.amount,
      weekly_earnings = 0,
      last_transfer_date = CURRENT_DATE,
      updated_at = NOW()
    FROM due
    WHERE account.id = due.id
    RETURNING due.amount
  `);

  return Number(rows[0]?.amount ?? 0);
}

async function getState(sql: ReturnType<typeof getDb>, transferAmount = 0) {
  const [challengeResult, accountResult] = await Promise.all([
    sql`
      SELECT id, title, reward_fcfa, completed
      FROM challenges
      ORDER BY id ASC
    `,
    sql`
      SELECT togo_market_balance, weekly_earnings, last_transfer_date
      FROM user_account
      WHERE id = 1
    `
  ]);
  const challengeRows = rowsOf<SqlRow>(challengeResult);
  const accountRows = rowsOf<AccountRow>(accountResult);

  const account = accountRows[0];
  return {
    challenges: challengeRows.map((row) => ({
      id: Number(row.id),
      title: String(row.title),
      rewardFcfa: Number(row.reward_fcfa),
      completed: Boolean(row.completed)
    })),
    balances: {
      weeklyEarnings: Number(account?.weekly_earnings ?? 0),
      togoMarketBalance: Number(account?.togo_market_balance ?? 0),
      lastTransferDate: account?.last_transfer_date ?? null
    },
    transferAmount
  };
}

function errorResponse(error: unknown) {
  console.error("Challenges API error:", error);
  return NextResponse.json(
    { error: "Impossible de charger les défis pour le moment." },
    { status: 500 }
  );
}

export async function GET() {
  try {
    await ensureSchema();
    const sql = getDb();
    await seedChallenges(sql);
    const transferAmount = await settleMonthlyTransfer(sql);
    return NextResponse.json(await getState(sql, transferAmount), {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const sql = getDb();
    const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
    const id = Number(body?.id);

    if (!Number.isInteger(id) || id < 1 || id > CHALLENGE_SEEDS.length) {
      return NextResponse.json({ error: "Défi invalide." }, { status: 400 });
    }

    await seedChallenges(sql);
    const transferAmount = await settleMonthlyTransfer(sql);
    const completedRows = rowsOf<{ reward_fcfa: number }>(await sql`
      WITH completed_challenge AS (
        UPDATE challenges
        SET completed = TRUE, updated_at = NOW()
        WHERE id = ${id} AND completed = FALSE
        RETURNING reward_fcfa
      ),
      updated_account AS (
        UPDATE user_account AS account
        SET
          weekly_earnings = account.weekly_earnings + completed_challenge.reward_fcfa,
          updated_at = NOW()
        FROM completed_challenge
        WHERE account.id = 1
        RETURNING account.weekly_earnings
      )
      SELECT
        completed_challenge.reward_fcfa,
        updated_account.weekly_earnings
      FROM completed_challenge
      CROSS JOIN updated_account
    `);

    if (completedRows.length === 0) {
      const existing = rowsOf<{ completed: boolean }>(
        await sql`SELECT completed FROM challenges WHERE id = ${id}`
      );
      if (existing.length > 0 && Boolean(existing[0].completed)) {
        return NextResponse.json(
          { error: "Ce défi est déjà complété." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "Défi introuvable." }, { status: 404 });
    }

    return NextResponse.json(
      {
        ...(await getState(sql, transferAmount)),
        completedChallenge: {
          id,
          rewardFcfa: Number(completedRows[0].reward_fcfa)
        }
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return errorResponse(error);
  }
}