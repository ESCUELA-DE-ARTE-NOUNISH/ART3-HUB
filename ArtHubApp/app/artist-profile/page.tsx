"use client";

import { useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type OpportunityStatus = "pending" | "applied" | "won";

interface Opportunity {
  id: number;
  name: string;
  status: OpportunityStatus;
  deadline?: string;
  amount?: number;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const ARTIST = {
  name: "Sofia Reyes",
  alias: "@sofiaonchain",
  level: "Emerging",
  goalAmount: 500,
  goalDeadline: "3 months",
  totalIncome: 180,
  monthlyIncome: 80,
  avatar: "SR",
};

const INITIAL_OPPORTUNITIES: Opportunity[] = [
  { id: 1, name: "Grant X",       status: "pending", deadline: "5 days" },
  { id: 2, name: "Contest Y",     status: "applied" },
  { id: 3, name: "Commission Z",  status: "won", amount: 100 },
];

const INCOME_LOG = [
  { id: 1, label: "Commission Z", amount: 100, status: "confirmed" },
  { id: 2, label: "Artwork sale",  amount: 80,  status: "paid"      },
];

// ── Status Config ────────────────────────────────────────────────────────────

const STATUS: Record<OpportunityStatus, { dot: string; badge: string; btn: string; label: string }> = {
  pending: {
    dot:   "bg-amber-400",
    badge: "bg-amber-50 text-amber-600 border border-amber-200",
    btn:   "bg-amber-500 hover:bg-amber-600 text-white",
    label: "Apply",
  },
  applied: {
    dot:   "bg-blue-400",
    badge: "bg-blue-50 text-blue-600 border border-blue-200",
    btn:   "bg-blue-500 hover:bg-blue-600 text-white",
    label: "Applied",
  },
  won: {
    dot:   "bg-emerald-400",
    badge: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    btn:   "bg-emerald-100 text-emerald-600 cursor-default",
    label: "Won ✓",
  },
};

// ── Main Component ───────────────────────────────────────────────────────────

export default function ArtistProfileDashboard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(INITIAL_OPPORTUNITIES);

  const goalPct = Math.round((ARTIST.totalIncome / ARTIST.goalAmount) * 100);

  function advanceStatus(id: number) {
    setOpportunities((prev) =>
      prev.map((op) => {
        if (op.id !== id || op.status === "won") return op;
        const next: Record<OpportunityStatus, OpportunityStatus> = {
          pending: "applied",
          applied: "won",
          won:     "won",
        };
        return { ...op, status: next[op.status] };
      })
    );
  }

  const pendingOp   = opportunities.find((o) => o.status === "pending");
  const wonCount    = opportunities.filter((o) => o.status === "won").length;
  const recommendation =
    wonCount >= 2
      ? "Great momentum! Consider raising your income goal for next month."
      : pendingOp
      ? `Apply to ${pendingOp.name}: high fit for your profile.`
      : "Keep tracking your opportunities to unlock personalised tips.";

  const barColor =
    goalPct >= 75 ? "bg-emerald-500" :
    goalPct >= 40 ? "bg-amber-500"   : "bg-rose-500";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-4">

        {/* ── Page Title ── */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Artist Profile</h1>
          <p className="text-sm text-gray-500">Track your progress & opportunities</p>
        </div>

        {/* ── Profile Card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {ARTIST.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-lg leading-tight">{ARTIST.name}</p>
            <p className="text-gray-400 text-sm">{ARTIST.alias}</p>
            <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
              {ARTIST.level}
            </span>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Goal</p>
            <p className="text-2xl font-bold text-gray-900">${ARTIST.goalAmount}</p>
            <p className="text-xs text-gray-400">in {ARTIST.goalDeadline}</p>
          </div>
        </div>

        {/* ── Economic Snapshot ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            💰 Economic Snapshot
          </p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Total income</p>
              <p className="text-xl font-bold text-gray-900">${ARTIST.totalIncome}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">This month</p>
              <p className="text-xl font-bold text-emerald-600">${ARTIST.monthlyIncome}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Progress</p>
              <p className={`text-xl font-bold ${goalPct >= 50 ? "text-emerald-600" : "text-amber-600"}`}>
                {goalPct}%
              </p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>$0</span>
              <span className="font-medium text-gray-600">${ARTIST.totalIncome} of ${ARTIST.goalAmount}</span>
              <span>${ARTIST.goalAmount}</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${goalPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Opportunities ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            🎯 Opportunities
          </p>
          <div className="space-y-2">
            {opportunities.map((op) => {
              const cfg = STATUS[op.status];
              return (
                <div key={op.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{op.name}</p>
                    {op.deadline && op.status === "pending" && (
                      <p className="text-xs text-amber-500">Deadline in {op.deadline}</p>
                    )}
                    {op.amount && op.status === "won" && (
                      <p className="text-xs text-emerald-600 font-medium">+${op.amount} earned</p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                    {op.status.charAt(0).toUpperCase() + op.status.slice(1)}
                  </span>
                  {op.status !== "won" && (
                    <button
                      onClick={() => advanceStatus(op.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${cfg.btn}`}
                    >
                      {cfg.label}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Income Log ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            📈 Income
          </p>
          <div className="space-y-2">
            {INCOME_LOG.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{entry.label}</p>
                  <p className="text-xs text-gray-400 capitalize">{entry.status}</p>
                </div>
                <span className="font-bold text-emerald-600 text-base">+${entry.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recommendation ── */}
        <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 rounded-2xl p-5">
          <div className="flex gap-3 items-start">
            <span className="text-violet-500 text-xl mt-0.5">✦</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-1">
                Agent Recommendation
              </p>
              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                "{recommendation}"
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 pb-4">Art3 Hub · Artist Profile MVP</p>

      </div>
    </div>
  );
}
