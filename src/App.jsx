import { useState } from "react";

// ----- demo data -----
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

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState("dark"); // "dark" or "sage"

  const isDark = theme === "dark";

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "budget", label: "Budget" },
    { id: "transactions", label: "Transactions" },
    { id: "goals", label: "Goals" },
  ];

  const appClass =
    "min-h-screen " +
    (isDark ? "bg-shell text-slate-100" : "bg-sageBg text-sageText");

  const headerClass =
    "border-b sticky top-0 z-50 backdrop-blur " +
    (isDark
      ? "border-slate-800 bg-[#050816]/95"
      : "border-sageBorder bg-sageBg/90");

  const navActive =
    "px-4 py-1 rounded-full border transition " +
    (isDark
      ? "border-accent bg-accent/10 text-accent"
      : "border-sageAccent bg-sageAccent/10 text-sageAccent");

  const navInactive =
    "px-4 py-1 rounded-full border transition " +
    (isDark
      ? "border-slate-600 text-slate-300 hover:border-accent hover:text-accent"
      : "border-sageBorder text-sageText hover:border-sageAccent hover:text-sageAccent");

  const cardClass =
    "rounded-3xl p-6 border " +
    (isDark ? "bg-card border-slate-800" : "bg-sageCard border-sageBorder");

  return (
    <div className={appClass}>
      {/* ---------- TOP NAV ---------- */}
      <header className={headerClass}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xs font-semibold tracking-[0.25em] text-accentSoft">
              BUDGET COMMAND CENTER
            </h1>
            <p className="text-[0.75rem] text-neutralSoft">
              Dark cyber budgeting with themed goals
            </p>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex gap-2 text-sm">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={activeTab === t.id ? navActive : navInactive}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            {/* Theme selector */}
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className={
                "text-xs rounded-full border px-3 py-1 outline-none cursor-pointer " +
                (isDark
                  ? "bg-shell border-slate-600 text-slate-200"
                  : "bg-sageCard border-sageBorder text-sageText")
              }
            >
              <option value="dark">Cyber dark</option>
              <option value="sage">Sage & cream</option>
            </select>
          </div>
        </div>
      </header>

      {/* ---------- PAGE CONTENT ---------- */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {activeTab === "dashboard" && (
  <DashboardPage cardClass={cardClass} theme={theme} />
)}
        {activeTab === "budget" && <BudgetPage cardClass={cardClass} />}
        {activeTab === "transactions" && (
          <TransactionsPage cardClass={cardClass} />
        )}
        {activeTab === "goals" && <GoalsPage cardClass={cardClass} />}
      </main>
    </div>
  );
}

/* ---------- SIMPLE PLACEHOLDER PAGES (still themed) ---------- */

function DashboardPage({ cardClass, theme }) {
  const isDark = theme === "dark";

  const leftover =
    monthSummary.income - monthSummary.fixed - monthSummary.variable;

  const allocationPercent =
    monthSummary.income > 0
      ? ((monthSummary.fixed + monthSummary.variable) / monthSummary.income) * 100
      : 0;

  return (
    <div className="space-y-8">
      {/* ---------- TITLE ---------- */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-bold">{monthSummary.monthLabel}</h2>
        </div>

        <p className="text-sm text-neutralSoft">
          Overview of this month’s money flow
        </p>
      </div>

      {/* ---------- MONTH OVERVIEW CARD ---------- */}
      <section className={cardClass}>
        <h3 className="mb-4 text-xs font-semibold tracking-[0.28em] text-neutralSoft">
          MONTH OVERVIEW
        </h3>

        <div className="grid gap-6 md:grid-cols-4">
          <OverviewStat
            label="INCOME"
            value={monthSummary.income}
            color={isDark ? "text-emerald-400" : "text-sageAccent"}
          />
          <OverviewStat
            label="FIXED"
            value={monthSummary.fixed}
            color={isDark ? "text-rose-400" : "text-sageAccent"}
          />
          <OverviewStat
            label="VARIABLE"
            value={monthSummary.variable}
            color={isDark ? "text-amber-300" : "text-sageAccent"}
          />
          <OverviewStat
            label="LEFTOVER"
            value={leftover}
            color={isDark ? "text-cyan-300" : "text-sageAccent"}
          />
        </div>

        {/* Progress bar */}
        <div className="mt-6 space-y-2">
          <p className="text-xs text-neutralSoft uppercase tracking-[0.16em]">
            Allocation this month
          </p>

          <div
            className={
              "h-2 w-full overflow-hidden rounded-full " +
              (isDark ? "bg-slate-900" : "bg-sageBorder")
            }
          >
            <div
              className={
                "h-full w-full transition-all duration-700 " +
                (isDark
                  ? "bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-emerald-300"
                  : "bg-sageAccent")
              }
              style={{ clipPath: `inset(0 ${100 - allocationPercent}% 0 0)` }}
            />
          </div>
        </div>
      </section>

      {/* ---------- GOALS PREVIEW ---------- */}
      <section>
        <h3 className="mb-4 text-xs font-semibold tracking-[0.28em] text-neutralSoft">
          GOALS
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} theme={theme} />
          ))}
        </div>
      </section>
    </div>
  );
}

function OverviewStat({ label, value, color }) {
  return (
    <div className="space-y-1">
      <p className="text-[0.7rem] tracking-[0.18em] text-neutralSoft">
        {label}
      </p>
      <p className={`text-xl font-semibold ${color}`}>
        ${value.toLocaleString()}
      </p>
    </div>
  );
}

function GoalCard({ goal, theme }) {
  const isDark = theme === "dark";
  const p = Math.min(100, Math.round((goal.current / goal.target) * 100));

  return (
    <div
      className={
        "rounded-2xl p-4 border flex flex-col gap-3 " +
        (isDark ? "bg-card border-slate-800" : "bg-sageCard border-sageBorder")
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={
              "flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold " +
              (isDark
                ? "bg-accent/15 text-accent"
                : "bg-sageAccent/15 text-sageAccent")
            }
          >
            {goal.code}
          </div>

          <div>
            <h4 className="font-medium">{goal.label}</h4>
            <p className="text-xs text-neutralSoft">
              Plan: ${goal.planPerMonth}/mo
            </p>
          </div>
        </div>

        <p className="text-sm">
          ${goal.current} / ${goal.target}
        </p>
      </div>

      {/* Progress bar */}
      <div
        className={
          "h-2 w-full overflow-hidden rounded-full " +
          (isDark ? "bg-slate-900" : "bg-sageBorder")
        }
      >
        <div
          className={
            "h-full transition-all duration-700 " +
            (isDark
              ? "bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-emerald-300"
              : "bg-sageAccent")
          }
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );
}

function BudgetPage({ cardClass }) {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Budget</h2>
      <p className="text-neutralSoft text-sm">
        This will show income, fixed costs, variable costs, and leftover money.
      </p>

      <div className={cardClass}>
        <p className="text-neutralSoft text-sm">Budget section placeholder.</p>
      </div>
    </div>
  );
}

function TransactionsPage({ cardClass }) {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Transactions</h2>
      <p className="text-neutralSoft text-sm">
        We will eventually load CSV files and auto-import transactions here.
      </p>

      <div className={cardClass}>
        <p className="text-neutralSoft text-sm">Transactions placeholder.</p>
      </div>
    </div>
  );
}

function GoalsPage({ cardClass }) {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Goals</h2>
      <p className="text-neutralSoft text-sm">
        We will add savings goals, progress bars, icons, etc.
      </p>

      <div className={cardClass}>
        <p className="text-neutralSoft text-sm">Goals section placeholder.</p>
      </div>
    </div>
  );
}
