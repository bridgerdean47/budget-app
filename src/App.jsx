import { useState } from "react";

// ----- demo data (you can replace later with real data) -----
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

const mockTransactions = [
  { id: 1, date: "2026-01-03", description: "Paycheck", type: "income", amount: 2200 },
  { id: 2, date: "2026-01-04", description: "Rent", type: "expense", amount: 900 },
  { id: 3, date: "2026-01-06", description: "Groceries", type: "expense", amount: 120.5 },
];

// ----- helper functions -----
function percent(current, target) {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

// ----- MAIN APP -----
export default function App() {
  // which tab is active?
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "budget", label: "Budget" },
    { id: "transactions", label: "Transactions" },
    { id: "goals", label: "Goal Detail" },
  ];

  return (
    <div className="min-h-screen bg-shell text-slate-100">
      {/* Top nav */}
      <header className="border-b border-slate-800 bg-[#050816]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xs font-semibold tracking-[0.22em] text-accentSoft">
              BUDGET COMMAND CENTER
            </h1>
            <p className="text-[0.75rem] text-neutralSoft">
              Dark cyber budgeting with themed goals
            </p>
          </div>

          <nav className="flex gap-2 text-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={
                  "rounded-full border px-4 py-1 transition " +
                  (activeTab === tab.id
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-slate-700 text-slate-300 hover:border-accent hover:text-accent")
                }
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-6xl px-6 py-6 space-y-8">
        {activeTab === "dashboard" && (
          <DashboardTab monthSummary={monthSummary} goals={goals} />
        )}

        {activeTab === "budget" && (
          <BudgetTab monthSummary={monthSummary} />
        )}

        {activeTab === "transactions" && (
          <TransactionsTab transactions={mockTransactions} />
        )}

        {activeTab === "goals" && <GoalDetailTab goals={goals} />}
      </main>
    </div>
  );
}

// ----- DASHBOARD TAB (what you already had) -----
function DashboardTab({ monthSummary, goals }) {
  const leftover =
    monthSummary.income - monthSummary.fixed - monthSummary.variable;

  const allocationPercent =
    monthSummary.income > 0
      ? ((monthSummary.fixed + monthSummary.variable) /
          monthSummary.income) *
        100
      : 0;

  return (
    <>
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

      {/* Goals + CSV import (same as before, just inside Dashboard tab) */}
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

        {/* Bank import UI (not wired yet) */}
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
    </>
  );
}

// ----- BUDGET TAB -----
function BudgetTab({ monthSummary }) {
  const leftover =
    monthSummary.income - monthSummary.fixed - monthSummary.variable;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Budget</h2>
      <p className="text-sm text-neutralSoft">
        High-level breakdown of this month&apos;s plan.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-card/80 p-4">
          <h3 className="text-sm font-medium mb-2">Planned amounts</h3>
          <ul className="space-y-1 text-sm">
            <li>Income: ${monthSummary.income.toFixed(2)}</li>
            <li>Fixed costs: ${monthSummary.fixed.toFixed(2)}</li>
            <li>Variable: ${monthSummary.variable.toFixed(2)}</li>
            <li>Leftover: ${leftover.toFixed(2)}</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-card/80 p-4">
          <h3 className="text-sm font-medium mb-2">Categories (example)</h3>
          <ul className="space-y-1 text-sm text-neutralSoft">
            <li>Housing, Food, Transport, Fun, Savings…</li>
            <li>
              Later you can store these in state and add a form to edit them.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// ----- TRANSACTIONS TAB -----
function TransactionsTab({ transactions }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Transactions</h2>
      <p className="text-sm text-neutralSoft">
        List of recent income and expenses.
      </p>

      <div className="rounded-3xl border border-slate-800 bg-card/80 p-5 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-shell text-slate-300">
              <th className="px-3 py-2 text-left border-b border-slate-700">Date</th>
              <th className="px-3 py-2 text-left border-b border-slate-700">Description</th>
              <th className="px-3 py-2 text-left border-b border-slate-700">Type</th>
              <th className="px-3 py-2 text-left border-b border-slate-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr
                key={t.id}
                className="border-b border-slate-700 hover:bg-slate-800/60"
              >
                <td className="px-3 py-2 text-slate-300">{t.date}</td>
                <td className="px-3 py-2 text-slate-100">{t.description}</td>
                <td
                  className={
                    "px-3 py-2 " +
                    (t.type === "income"
                      ? "text-emerald-400"
                      : "text-rose-400")
                  }
                >
                  {t.type === "income" ? "Income" : "Expense"}
                </td>
                <td className="px-3 py-2 text-slate-100">
                  ${t.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ----- GOAL DETAIL TAB -----
function GoalDetailTab({ goals }) {
  const mainGoal = goals[0]; // just show first goal for now
  const p = percent(mainGoal.current, mainGoal.target);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Goal Detail</h2>
      <p className="text-sm text-neutralSoft">
        Focus view for a single savings or payoff goal.
      </p>

      <div className="rounded-3xl border border-slate-800 bg-card/80 p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
              {mainGoal.code}
            </div>
            <div>
              <h3 className="text-lg font-medium">{mainGoal.label}</h3>
              <p className="text-xs text-neutralSoft">
                Plan: ${mainGoal.planPerMonth}/month
              </p>
            </div>
          </div>
          <div className="text-sm text-slate-200">
            ${mainGoal.current.toLocaleString()} / $
            {mainGoal.target.toLocaleString()}
          </div>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-900">
          <div
            className="h-full bg-gradient-to-r from-fuchsia-400 via-rose-400 to-amber-300"
            style={{ width: `${p}%` }}
          />
        </div>

        <p className="text-xs text-neutralSoft">
          You&apos;re {p}% of the way to this goal. Later you can connect this
          to real transactions tagged to this goal.
        </p>
      </div>
    </section>
  );
}
