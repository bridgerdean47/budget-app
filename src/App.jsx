// src/App.jsx

const monthSummary = {
  monthLabel: "January 2026",
  income: 4500,
  fixed: 2330,
  variable: 850,
};

const goals = [
  {
    id: 1,
    label: "Japan Trip",
    code: "JP",
    planPerMonth: 270,
    current: 500,
    target: 5000,
  },
  {
    id: 2,
    label: "Azera Loan",
    code: "AZ",
    planPerMonth: 380,
    current: 0,
    target: 7692,
  },
];

function percent(current, target) {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function OverviewStat({ label, value, color }) {
  return (
    <div className="space-y-1">
      <p className="text-[0.7rem] tracking-[0.18em] text-neutralSoft">
        {label}
      </p>
      <p className={`text-xl font-semibold ${color}`}>${value.toFixed(2)}</p>
    </div>
  );
}

function GoalCard({ goal }) {
  const p = percent(goal.current, goal.target);

  return (
    <div className="flex flex-col rounded-2xl border border-slate-800 bg-card/70 p-4">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-[0.7rem] font-semibold text-accent">
            {goal.code}
          </div>
          <span className="text-sm font-medium">{goal.label}</span>
        </div>
        <div className="text-[0.7rem] text-neutralSoft">
          Plan: ${goal.planPerMonth}/mo
        </div>
      </div>

      <div className="text-xs text-slate-200">
        ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-900">
        <div
          className="h-full bg-gradient-to-r from-fuchsia-400 via-rose-400 to-amber-300"
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );
}

export default function App() {
  const leftover =
    monthSummary.income - monthSummary.fixed - monthSummary.variable;

  const allocationPercent =
    monthSummary.income > 0
      ? ((monthSummary.fixed + monthSummary.variable) /
          monthSummary.income) *
        100
      : 0;

  return (
    <div className="min-h-screen bg-shell text-slate-100">
      {/* Top nav */}
      <header className="border-b border-slate-800 bg-[#050816]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xs font-semibold tracking-[0.22em] text-accentSoft">
              BUDGET CENTER
            </h1>
            <p className="text-[0.75rem] text-neutralSoft">
            </p>
          </div>

          <nav className="flex gap-2 text-sm">
            {["Dashboard", "Budget", "Transactions", "Goal Detail"].map(
              (item, i) => (
                <button
                  key={item}
                  className={
                    "rounded-full border px-4 py-1 transition " +
                    (i === 0
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-slate-700 text-slate-300 hover:border-accent hover:text-accent")
                  }
                >
                  {item}
                </button>
              ),
            )}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-6xl px-6 py-6 space-y-8">
        {/* Month heading */}
        <section className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold">
              {monthSummary.monthLabel}
            </h2>
          </div>
          <p className="text-sm text-neutralSoft">
            Overview of this month&apos;s money flow
          </p>
        </section>

        {/* Month overview card */}
        <section className="rounded-3xl border border-slate-800 bg-card/80 p-5 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
          <h3 className="mb-4 text-xs font-semibold tracking-[0.28em] text-neutralSoft">
            MONTH OVERVIEW
          </h3>

          <div className="grid gap-4 md:grid-cols-4">
            <OverviewStat
              label="INCOME"
              value={monthSummary.income}
              color="text-emerald-400"
            />
            <OverviewStat
              label="FIXED"
              value={monthSummary.fixed}
              color="text-rose-400"
            />
            <OverviewStat
              label="VARIABLE"
              value={monthSummary.variable}
              color="text-amber-300"
            />
            <OverviewStat
              label="LEFTOVER"
              value={leftover}
              color="text-cyan-300"
            />
          </div>

          <div className="mt-5 space-y-2">
            <p className="text-xs text-neutralSoft uppercase tracking-[0.16em]">
              Allocation this month
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full w-full bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-emerald-300"
                style={{
                  clipPath: `inset(0 ${100 - allocationPercent}% 0 0)`,
                }}
              />
            </div>
          </div>
        </section>

        {/* Goals row + CSV import */}
        <section className="grid gap-5 lg:grid-cols-[2fr,1.2fr]">
          {/* Goals */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-[0.28em] text-neutralSoft">
                GOALS
              </h3>
              <button className="rounded-full border border-accent px-4 py-1 text-xs text-accent hover:bg-accent hover:text-slate-900 transition">
                + Add Goal
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          </div>

          {/* Bank import */}
          <div className="rounded-3xl border border-slate-800 bg-card/80 p-5">
            <h3 className="text-xs font-semibold tracking-[0.28em] text-neutralSoft">
              BANK STATEMENT IMPORT (CSV)
            </h3>
            <p className="mt-3 text-xs text-slate-200">
              Upload a <span className="text-accent">.csv</span> bank
              statement. We&apos;ll parse basic fields like date, description,
              and amount.
            </p>

            <div className="mt-4">
              <label className="inline-flex cursor-pointer flex-col gap-2 text-xs">
                <span className="inline-flex items-center justify-center rounded-full border border-accent bg-accent/10 px-4 py-1.5 text-accent hover:bg-accent hover:text-slate-900 transition">
                  Choose CSV file
                </span>
                <input type="file" className="hidden" />
              </label>
            </div>

            <p className="mt-3 text-[0.7rem] text-neutralSoft">
              Tip: Most banks let you export recent transactions as CSV from
              their website. You can then map those rows into this budget
              tracker.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
