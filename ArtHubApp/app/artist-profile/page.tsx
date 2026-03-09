"use client";

import { useState } from "react";

const ARTIST = {
  name: "Sofia Reyes",
  alias: "@sofiaonchain",
  level: "Emerging",
  goalAmount: 500,
  goalDeadline: "3 months",
  baseIncome: 80,
  avatar: "SR",
};

type OpportunityStatus = "suggested" | "applied" | "won";

interface Opportunity {
  id: number;
  name: string;
  status: OpportunityStatus;
  deadline?: string;
  amount: number;
}

const INITIAL_OPPORTUNITIES: Opportunity[] = [
  { id: 1, name: "Grant X",      status: "suggested", deadline: "5 days", amount: 150 },
  { id: 2, name: "Contest Y",    status: "applied",                        amount: 200 },
  { id: 3, name: "Commission Z", status: "won",                            amount: 100 },
];

const statusConfig: Record<OpportunityStatus, { dot: string; btnLabel: string }> = {
  suggested: { dot: "bg-amber-400",   btnLabel: "Apply"        },
  applied:   { dot: "bg-blue-400",    btnLabel: "Mark as won"  },
  won:       { dot: "bg-emerald-400", btnLabel: "Won"          },
};

export default function ArtistProfileDashboard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(INITIAL_OPPORTUNITIES);

  // ── Dynamic income & progress based on won opportunities ──
  const wonIncome = opportunities
    .filter((o) => o.status === "won")
    .reduce((sum, o) => sum + o.amount, 0);
  const totalIncome = ARTIST.baseIncome + wonIncome;
  const goalPct = Math.min(100, Math.round((totalIncome / ARTIST.goalAmount) * 100));

  // ── Dynamic income log: updates when opportunity is won ──
  const incomeLog = [
    { id: 0, label: "Artwork sale", amount: ARTIST.baseIncome, status: "paid" },
    ...opportunities
      .filter((o) => o.status === "won")
      .map((o) => ({ id: o.id, label: o.name, amount: o.amount, status: "confirmed" })),
  ];

  function advanceStatus(id: number) {
    setOpportunities((prev) =>
      prev.map((op) => {
        if (op.id !== id) return op;
        const next: Record<OpportunityStatus, OpportunityStatus> = {
          suggested: "applied",
          applied: "won",
          won: "won",
        };
        return { ...op, status: next[op.status] };
      })
    );
  }

  const firstSuggested = opportunities.find((o) => o.status === "suggested");
  const recommendation =
    goalPct >= 100
      ? "🎉 Goal reached! Consider raising your target for next month."
      : firstSuggested
      ? `Apply to ${firstSuggested.name}: high fit for your profile.`
      : opportunities.some((o) => o.status === "applied")
      ? "Follow up on your applications — mark them as won when confirmed!"
      : "Keep tracking your opportunities to unlock personalised tips.";

  const progressColor =
    goalPct >= 75
      ? "from-emerald-500 to-teal-400"
      : goalPct >= 40
      ? "from-amber-500 to-yellow-400"
      : "from-rose-500 to-pink-400";

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white px-4 py-10 flex flex-col items-center">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .font-display { font-family: 'Syne', sans-serif; }
        .glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(12px);
        }
        .progress-bar { transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .card { animation: fadeUp 0.5s ease both; }
        .card:nth-child(1) { animation-delay: 0.05s; }
        .card:nth-child(2) { animation-delay: 0.15s; }
        .card:nth-child(3) { animation-delay: 0.25s; }
        .card:nth-child(4) { animation-delay: 0.35s; }
        .card:nth-child(5) { animation-delay: 0.45s; }
      `}</style>

      <div className="w-full max-w-lg space-y-4">

        {/* ── Profile ── */}
        <div className="card glass rounded-2xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-display font-bold text-xl shrink-0">
            {ARTIST.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-xl leading-tight truncate">{ARTIST.name}</h1>
            <p className="text-white/50 text-sm">{ARTIST.alias}</p>
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {ARTIST.level}
            </span>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-white/40 uppercase tracking-widest">Goal</p>
            <p className="font-display font-bold text-lg">${ARTIST.goalAmount}</p>
            <p className="text-xs text-white/40">in {ARTIST.goalDeadline}</p>
          </div>
        </div>

        {/* ── Economic Snapshot ── */}
        <div className="card glass rounded-2xl p-6 space-y-4">
          <h2 className="font-display font-semibold text-sm uppercase tracking-widest text-white/40">
            Economic Snapshot
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-xs text-white/40 mb-1">Total</p>
              <p className="font-display font-bold text-lg">${totalIncome}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-xs text-white/40 mb-1">This month</p>
              <p className="font-display font-bold text-lg text-emerald-400">${ARTIST.baseIncome}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-xs text-white/40 mb-1">Progress</p>
              <p className={`font-display font-bold text-lg ${goalPct >= 50 ? "text-emerald-400" : "text-amber-400"}`}>
                {goalPct}%
              </p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-white/30 mb-2">
              <span>$0</span><span>${ARTIST.goalAmount}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r progress-bar ${progressColor}`}
                style={{ width: `${goalPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Opportunities ── */}
        <div className="card glass rounded-2xl p-6 space-y-3">
          <h2 className="font-display font-semibold text-sm uppercase tracking-widest text-white/40">
            Opportunities
          </h2>
          {opportunities.map((op) => {
            const cfg = statusConfig[op.status];
            return (
              <div key={op.id} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{op.name}</p>
                  {op.deadline && op.status === "suggested" && (
                    <p className="text-xs text-amber-400/70">Deadline in {op.deadline}</p>
                  )}
                  {op.status === "won" && (
                    <p className="text-xs text-emerald-400/70">+${op.amount} earned</p>
                  )}
                </div>
                <button
                  onClick={() => advanceStatus(op.id)}
                  disabled={op.status === "won"}
                  className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all
                    ${op.status === "won"
                      ? "border-emerald-500/30 text-emerald-400 cursor-default"
                      : op.status === "applied"
                      ? "border-blue-500/30 text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                      : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                    }`}
                >
                  {cfg.btnLabel}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Income Log (updates dynamically) ── */}
        <div className="card glass rounded-2xl p-6 space-y-3">
          <h2 className="font-display font-semibold text-sm uppercase tracking-widest text-white/40">
            Income
          </h2>
          {incomeLog.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <div>
                <p className="font-medium text-sm">{entry.label}</p>
                <p className="text-xs text-white/40 capitalize">{entry.status}</p>
              </div>
              <p className="font-display font-bold text-emerald-400">+${entry.amount}</p>
            </div>
          ))}
        </div>

        {/* ── Recommendation (updates dynamically) ── */}
        <div className="card rounded-2xl p-5 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 border border-violet-500/20">
          <div className="flex gap-3 items-start">
            <span className="text-2xl mt-0.5">✦</span>
            <div>
              <p className="font-display font-semibold text-xs uppercase tracking-widest text-violet-300 mb-1">
                Agent Recommendation
              </p>
              <p className="text-sm text-white/80 leading-relaxed">{recommendation}</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
