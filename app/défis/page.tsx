"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Challenge } from "@/lib/challenges";

type ApiState = {
  challenges: Challenge[];
  balances: {
    weeklyEarnings: number;
    togoMarketBalance: number;
    lastTransferDate: string | null;
  };
  transferAmount?: number;
};

const formatFcfa = (amount: number) =>
  new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";

export default function DefisPage() {
  const [state, setState] = useState<ApiState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadState = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/challenges", { cache: "no-store" });
      const data = (await response.json()) as ApiState & { error?: string };
      if (!response.ok) throw new Error(data.error || "La connexion à Neon a échoué.");
      setState(data);
      if (data.transferAmount) {
        setNotice(
          `${formatFcfa(data.transferAmount)} ont été transférés vers votre solde principal.`
        );
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const completedCount = useMemo(
    () => state?.challenges.filter((challenge) => challenge.completed).length ?? 0,
    [state]
  );
  const progress = state ? Math.round((completedCount / 10) * 100) : 0;

  async function completeChallenge(challenge: Challenge) {
    if (challenge.completed || activeId !== null) return;
    setActiveId(challenge.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: challenge.id })
      });
      const data = (await response.json()) as ApiState & {
        error?: string;
        completedChallenge?: { rewardFcfa: number };
      };
      if (!response.ok) throw new Error(data.error || "Le défi n'a pas pu être validé.");
      setState(data);
      setNotice(
        `Défi validé : +${formatFcfa(data.completedChallenge?.rewardFcfa ?? challenge.rewardFcfa)} dans les gains de la semaine.`
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
      await loadState();
    } finally {
      setActiveId(null);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-ink text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(14,116,144,.34),transparent_34%),radial-gradient(circle_at_92%_18%,rgba(249,115,98,.18),transparent_30%)]" />
      <div className="relative mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:py-10">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-mint">
              TogoMarket · Aného
            </p>
            <h1 className="font-display text-3xl font-black tracking-tight sm:text-5xl">
              Les 10 défis de la semaine
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Validez les défis au fil de la semaine. Vos récompenses s&apos;accumulent
              ici, puis rejoignent automatiquement votre solde principal le 1er du mois.
            </p>
          </div>
          <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right sm:block">
            <p className="text-xs uppercase tracking-widest text-slate-400">Accès direct</p>
            <p className="mt-1 text-sm font-semibold text-sand">Sans inscription</p>
          </div>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-3" aria-label="Résumé des soldes">
          <BalanceCard
            label="Gains de la semaine"
            value={state ? formatFcfa(state.balances.weeklyEarnings) : "—"}
            detail="Récompenses des défis validés"
            accent="mint"
          />
          <BalanceCard
            label="Solde principal TogoMarket"
            value={state ? formatFcfa(state.balances.togoMarketBalance) : "—"}
            detail="Transfert automatique chaque 1er du mois"
            accent="coral"
          />
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-glow">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300">Progression</p>
              <span className="text-2xl font-black text-sand">{progress}%</span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/25">
              <div
                className="h-full rounded-full bg-gradient-to-r from-mint to-cyan-300 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-400">
              {completedCount} défi{completedCount > 1 ? "s" : ""} sur 10 complété
              {completedCount > 1 ? "s" : ""}
            </p>
          </div>
        </section>

        {notice && (
          <div className="mb-6 rounded-2xl border border-mint/30 bg-mint/10 px-4 py-3 text-sm text-emerald-100">
            {notice}
          </div>
        )}
        {error && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-rose-100">
            <span>{error}</span>
            <button
              className="rounded-xl border border-white/20 px-3 py-2 font-semibold text-white transition hover:bg-white/10"
              onClick={() => void loadState()}
            >
              Réessayer
            </button>
          </div>
        )}

        <section aria-labelledby="challenge-list-title">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-coral">Cette semaine</p>
              <h2 id="challenge-list-title" className="mt-1 text-2xl font-black text-sand">
                Votre parcours
              </h2>
            </div>
            <p className="text-right text-xs text-slate-400">Chaque défi ne peut être validé qu&apos;une fois.</p>
          </div>

          {loading && !state ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-10 text-center text-slate-300">
              Chargement des défis…
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(state?.challenges ?? []).map((challenge) => (
                <article
                  key={challenge.id}
                  className={`group flex items-center gap-4 rounded-3xl border p-4 transition ${
                    challenge.completed
                      ? "border-mint/30 bg-mint/[0.08]"
                      : "border-white/10 bg-white/[0.06] hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-white/[0.1]"
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-black ${
                      challenge.completed
                        ? "bg-mint text-ink"
                        : "bg-ocean text-sand ring-1 ring-white/10"
                    }`}
                  >
                    {challenge.completed ? "✓" : String(challenge.id).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-white">{challenge.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Récompense :{" "}
                      <span className="font-semibold text-sand">{formatFcfa(challenge.rewardFcfa)}</span>
                    </p>
                  </div>
                  <button
                    disabled={challenge.completed || activeId !== null}
                    onClick={() => void completeChallenge(challenge)}
                    className={`shrink-0 rounded-xl px-3 py-2 text-sm font-bold transition ${
                      challenge.completed
                        ? "cursor-default bg-white/10 text-mint"
                        : "bg-coral text-white shadow-lg shadow-coral/10 hover:bg-[#ff8978] disabled:cursor-wait disabled:opacity-60"
                    }`}
                  >
                    {activeId === challenge.id
                      ? "Validation…"
                      : challenge.completed
                        ? "Complété"
                        : "Valider"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-12 border-t border-white/10 pt-5 text-xs leading-5 text-slate-500">
          Les soldes sont affichés en FCFA. Le transfert mensuel est contrôlé côté serveur
          par Neon pour éviter les doubles crédits.
        </footer>
      </div>
    </main>
  );
}

function BalanceCard({
  label,
  value,
  detail,
  accent
}: {
  label: string;
  value: string;
  detail: string;
  accent: "mint" | "coral";
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-glow">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${accent === "mint" ? "bg-mint" : "bg-coral"}`} />
        <p className="text-sm font-semibold text-slate-300">{label}</p>
      </div>
      <p className="mt-4 break-words text-3xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  );
}