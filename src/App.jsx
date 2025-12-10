import { useState } from "react";

import Papa from "papaparse";
import { parseBankCsv } from "./utils/parseBankCsv";

/* ---------- Demo data ---------- */

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

const initialTransactions = [
  {
    id: 1,
    date: "2026-01-03",
    description: "Paycheck",
    type: "income",
    amount: 2200,
  },
  {
    id: 2,
    date: "2026-01-04",
    description: "Rent",
    type: "expense",
    amount: 900,
  },
  {
    id: 3,
    date: "2026-01-06",
    description: "Groceries",
    type: "expense",
    amount: 120.5,
  },
];

/* ---------- Main app ---------- */

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState("dark"); // "dark" | "sage"
  const [transactions, setTransactions] = useState(initialTransactions);
  // Derived totals from imported transactions
  const incomeFromCsv = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  // For now, keep fixed + variable as planned numbers you can later make editable
  const fixedPlanned = 2330;
  const variablePlanned = 850;

  const monthSummary = {
    monthLabel: "January 2026",
    income: incomeFromCsv,
    fixed: fixedPlanned,
    variable: variablePlanned,
  };

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
      {/* ---------- HEADER ---------- */}
      <header className={headerClass}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1
              className={
                "text-xs font-semibold tracking-[0.25em] " +
                (isDark ? "text-accentSoft" : "text-sageAccent")
              }
            >
              B&amp;M BUDGET
            </h1>
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

            {/* Theme dropdown */}
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
              <option value="sage">Sage &amp; cream</option>
            </select>
          </div>
        </div>
      </header>

      {/* ---------- MAIN CONTENT ---------- */}
      <main className="max-w-6xl mx-auto px-6 py-10">
{activeTab === "dashboard" && (
  <DashboardPage theme={theme} cardClass={cardClass} monthSummary={monthSummary} />
)}

{activeTab === "budget" && (
  <BudgetPage cardClass={cardClass} monthSummary={monthSummary} />
)}

        {activeTab === "transactions" && (
          <TransactionsPage
            theme={theme}
            cardClass={cardClass}
            transactions={transactions}
            onAddTransactions={(newItems) =>
              setTransactions((prev) => [...prev, ...newItems])
            }
          />
        )}

        {activeTab === "goals" && <GoalsPage cardClass={cardClass} />}
      </main>
    </div>
  );
}

/* ---------- Dashboard with Sankey ---------- */

function DashboardPage({ theme, cardClass, monthSummary }) {
  const isDark = theme === "dark";

  const leftover =
    monthSummary.income - monthSummary.fixed - monthSummary.variable;

  const allocationPercent =
    monthSummary.income > 0
      ? ((monthSummary.fixed + monthSummary.variable) / monthSummary.income) *
        100
      : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-bold">{monthSummary.monthLabel}</h2>
        </div>
        <p className="text-sm text-neutralSoft">
          Overview of this month&apos;s money flow
        </p>
      </div>

      {/* Month overview card */}
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

      {/* Cash-flow Sankey diagram */}
      <CashFlowSankey theme={theme} income={monthSummary.income} />

      {/* Goals preview */}
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

/* ---------- Budget tab ---------- */

function BudgetPage({ cardClass, monthSummary }) {
  const leftover =
    monthSummary.income - monthSummary.fixed - monthSummary.variable;

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Budget</h2>
      <p className="text-neutralSoft text-sm">
        High-level breakdown of this month&apos;s plan.
      </p>

      <section className={cardClass}>
        <h3 className="text-sm font-medium mb-3">Planned amounts</h3>
        <ul className="space-y-1 text-sm">
          <li>Income: ${monthSummary.income.toFixed(2)}</li>
          <li>Fixed costs: ${monthSummary.fixed.toFixed(2)}</li>
          <li>Variable: ${monthSummary.variable.toFixed(2)}</li>
          <li>Leftover: ${leftover.toFixed(2)}</li>
        </ul>
      </section>
    </div>
  );
}

/* ---------- Transactions tab with CSV import ---------- */

function TransactionsPage({
  theme,
  cardClass,
  transactions,
  onAddTransactions,
}) {
  const isDark = theme === "dark";
  const [file, setFile] = useState(null);

  const handleImport = () => {
    if (!file) {
      alert("Choose a CSV file first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = parseCsv(text, transactions.length);
      if (!parsed.length) {
        alert("No valid rows found in CSV.");
      } else {
        onAddTransactions(parsed);
        alert(`Imported ${parsed.length} transactions.`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Transactions</h2>
        <p className="text-neutralSoft text-sm">
          Upload a bank CSV or add transactions manually later.
        </p>
      </div>

      {/* Import card */}
      <section className={cardClass}>
        <h3 className="text-xs font-semibold tracking-[0.28em] text-neutralSoft">
          BANK STATEMENT IMPORT (CSV)
        </h3>

        <p className="mt-3 text-xs text-neutralSoft">
          Supported formats:
          <br />
          1) <strong>Type, Description, Amount, Date</strong>
          <br />
          2) <strong>Date, Description, Amount</strong> (Amount &gt; 0 =
          income, Amount &lt; 0 = expense)
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <label className="inline-flex cursor-pointer flex-col gap-2">
            <span
              className={
                "inline-flex items-center justify-center rounded-full border px-4 py-1.5 " +
                (isDark
                  ? "border-accent bg-accent/10 text-accent hover:bg-accent hover:text-slate-900"
                  : "border-sageAccent bg-sageAccent/10 text-sageAccent hover:bg-sageAccent hover:text-sageCard")
              }
            >
              Choose CSV file
            </span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          <button
            type="button"
            onClick={handleImport}
            className={
              "rounded-full border px-4 py-1.5 text-xs transition " +
              (isDark
                ? "border-accent text-accent hover:bg-accent hover:text-slate-900"
                : "border-sageAccent text-sageAccent hover:bg-sageAccent hover:text-sageCard")
            }
          >
            Import CSV
          </button>

          {file && (
            <span className="text-[0.7rem] text-neutralSoft">
              Selected: {file.name}
            </span>
          )}
        </div>
      </section>

      {/* Transactions table */}
      <section className={cardClass}>
        <h3 className="mb-3 text-sm font-medium">
          Imported + sample transactions
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-700/40">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr
                className={
                  isDark
                    ? "bg-shell text-slate-200"
                    : "bg-sageBg text-sageText"
                }
              >
                <th className="px-4 py-3 text-left border-b border-slate-700/60 font-semibold">
                  Date
                </th>
                <th className="px-4 py-3 text-left border-b border-slate-700/60 font-semibold">
                  Description
                </th>
                <th className="px-4 py-3 text-left border-b border-slate-700/60 font-semibold">
                  Type
                </th>
                <th className="px-4 py-3 text-left border-b border-slate-700/60 font-semibold">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr
                  key={t.id}
                  className={
                    "border-b " +
                    (isDark
                      ? "border-slate-700/50 hover:bg-slate-800/40"
                      : "border-sageBorder hover:bg-sageBg")
                  }
                >
                  <td
                    className={
                      "px-4 py-2 " +
                      (isDark ? "text-slate-200" : "text-sageText")
                    }
                  >
                    {t.date}
                  </td>
                  <td
                    className={
                      "px-4 py-2 " +
                      (isDark ? "text-slate-100" : "text-sageText")
                    }
                  >
                    {t.description}
                  </td>
                  <td
                    className={
                      "px-4 py-2 " +
                      (t.type === "income"
                        ? "text-emerald-400"
                        : "text-rose-400")
                    }
                  >
                    {t.type === "income" ? "Income" : "Expense"}
                  </td>
                  <td
                    className={
                      "px-4 py-2 " +
                      (isDark ? "text-slate-100" : "text-sageText")
                    }
                  >
                    ${t.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ---------- Goals tab ---------- */

function GoalsPage({ cardClass }) {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Goals</h2>
      <p className="text-neutralSoft text-sm">
        We will add goal creation / editing here.
      </p>

      <section className={cardClass}>
        <p className="text-neutralSoft text-sm">
          For now, goals are visible on the Dashboard.
        </p>
      </section>
    </div>
  );
}

/* ---------- Cash-flow Sankey ---------- */

function CashFlowSankey({ theme, income }) {
  const isDark = theme === "dark";

  // Hide card if no income yet
  if (!income || income <= 0) return null;

  // Split income – adjust shares later if you want
  const flows = [
    { id: "savings", label: "Savings", share: 0.33, colorDark: "#22c55e", colorLight: "#15803d" },
    { id: "fixed", label: "Fixed", share: 0.38, colorDark: "#fb7185", colorLight: "#b91c1c" },
    { id: "disc", label: "Discretionary", share: 0.29, colorDark: "#eab308", colorLight: "#a16207" },
  ];

  const slices = flows.map((f) => ({
    ...f,
    value: income * f.share,
  }));

  const total = slices.reduce((s, x) => s + x.value, 0);

  // Helper to build a donut arc path
  const makeArcPath = (cx, cy, rOuter, rInner, startAngle, endAngle) => {
    const toRad = (deg) => ((deg - 90) * Math.PI) / 180;

    const sOuter = toRad(startAngle);
    const eOuter = toRad(endAngle);
    const sInner = eOuter;
    const eInner = sOuter;

    const x1Outer = cx + rOuter * Math.cos(sOuter);
    const y1Outer = cy + rOuter * Math.sin(sOuter);
    const x2Outer = cx + rOuter * Math.cos(eOuter);
    const y2Outer = cy + rOuter * Math.sin(eOuter);

    const x1Inner = cx + rInner * Math.cos(sInner);
    const y1Inner = cy + rInner * Math.sin(sInner);
    const x2Inner = cx + rInner * Math.cos(eInner);
    const y2Inner = cy + rInner * Math.sin(eInner);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M ${x1Outer} ${y1Outer}`,
      `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer}`,
      `L ${x1Inner} ${y1Inner}`,
      `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${x2Inner} ${y2Inner}`,
      "Z",
    ].join(" ");
  };

  // Compute angles for each slice
  let currentAngle = 0;
  const withAngles = slices.map((s) => {
    const sliceAngle = total > 0 ? (s.value / total) * 360 : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;
    return { ...s, startAngle, endAngle };
  });

  const cx = 90;
  const cy = 90;
  const outerRadius = 70;
  const innerRadius = 45;

  return (
    <section className="mt-2 rounded-3xl border border-slate-800 bg-card/80 p-4">
      <h3 className="mb-2 text-xs font-semibold tracking-[0.28em] text-neutralSoft">
        CASH FLOW
      </h3>

      <div
        className={
          "rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-6 " +
          (isDark ? "bg-[#020617]" : "bg-sageCard")
        }
      >
        {/* Left: donut chart */}
        <div className="flex justify-center items-center">
          <svg width="180" height="180" viewBox="0 0 180 180">
            {/* Background ring */}
            <circle
              cx={cx}
              cy={cy}
              r={outerRadius}
              fill={isDark ? "#020617" : "#e7ebdd"}
            />

            {withAngles.map((slice) => {
              const color = isDark ? slice.colorDark : slice.colorLight;
              const d = makeArcPath(
                cx,
                cy,
                outerRadius,
                innerRadius,
                slice.startAngle,
                slice.endAngle
              );
              return (
                <path
                  key={slice.id}
                  d={d}
                  fill={color}
                  fillOpacity={0.9}
                  stroke={isDark ? "#020617" : "#e7ebdd"}
                  strokeWidth={1}
                />
              );
            })}

            {/* Center label */}
            <circle cx={cx} cy={cy} r={innerRadius - 6} fill={isDark ? "#020617" : "#f4f3ec"} />
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              className="text-xs"
              fill={isDark ? "#e5e7eb" : "#111827"}
            >
              Income
            </text>
            <text
              x={cx}
              y={cy + 12}
              textAnchor="middle"
              className="text-sm font-semibold"
              fill={isDark ? "#e5e7eb" : "#111827"}
            >
              ${income.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </text>
          </svg>
        </div>

        {/* Right: legend */}
        <div className="flex-1 space-y-3">
          {withAngles.map((slice) => {
            const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
            const color = isDark ? slice.colorDark : slice.colorLight;
            return (
              <div
                key={slice.id}
                className="flex items-center justify-between text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium">{slice.label}</span>
                </div>
                <div className="text-right text-neutralSoft">
                  <span className="mr-2">
                    ${slice.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}



/* ---------- Shared components ---------- */

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

// --- CSV helpers ----------------------------------------------------

function splitCsvLine(line) {
  // Split a CSV line while respecting quotes
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];

    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

function isIsoDate(str) {
  // YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}

function parseCsv(text, startId = 0) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];

  const result = [];
  let idCounter = startId + 1;

  // ----- Inspect header -----------------------------------------------------------------
  let startIndex = 0;
  let headerCols = [];
  let headerLower = [];

  if (lines.length > 0) {
    headerCols = splitCsvLine(lines[0]).map((c) =>
      c.trim().replace(/^"|"$/g, "")
    );
    headerLower = headerCols.map((c) => c.toLowerCase());
  }

  // Bank format #1: ExportedTransactions.csv
  const hasBank1Header =
    headerLower.includes("posting date") &&
    headerLower.includes("transaction type") &&
    headerLower.some((c) => c === "amount" || c.startsWith("amount"));

  let bank1 = null;
  if (hasBank1Header) {
    bank1 = {
      postingIdx: headerLower.indexOf("posting date"),
      txnTypeIdx: headerLower.indexOf("transaction type"),
      amountIdx: headerLower.findIndex((c) => c === "amount" || c.startsWith("amount")),
      descIdx: (() => {
        let idx = headerLower.findIndex((c) =>
          c.includes("extended description")
        );
        if (idx === -1)
          idx = headerLower.findIndex((c) => c === "description");
        return idx;
      })(),
    };
  }

  // Bank format #2: Money Market Transactions.csv
  const hasBank2Header =
    headerLower.includes("account id") &&
    headerLower.includes("transaction id") &&
    headerLower.includes("date") &&
    headerLower.some((c) => c === "amount" || c.startsWith("amount"));

  let bank2 = null;
  if (hasBank2Header) {
    bank2 = {
      dateIdx: headerLower.indexOf("date"),
      descIdx: headerLower.indexOf("description"),
      amountIdx: headerLower.findIndex((c) => c === "amount" || c.startsWith("amount")),
    };
  }

  // Bank format #3: Chase credit card CSV
  // Headers: Transaction Date, Post Date, Description, Category, Type, Amount, Memo
  const hasChaseHeader =
    headerLower.includes("transaction date") &&
    headerLower.includes("description") &&
    headerLower.includes("amount");

  let chase = null;
  if (hasChaseHeader) {
    chase = {
      dateIdx: headerLower.indexOf("transaction date"),
      descIdx: headerLower.indexOf("description"),
      amountIdx: headerLower.indexOf("amount"),
      typeIdx: headerLower.indexOf("type"), // may be -1 if not present
    };
  }

  // Generic headers for simple formats
  const hasSimpleHeader =
    headerLower.includes("type") &&
    headerLower.some((c) => c.startsWith("description")) &&
    headerLower.some((c) => c.startsWith("amount")) &&
    headerLower.some((c) => c.startsWith("date"));
  const hasDateDescAmountHeader =
    headerLower.includes("date") &&
    headerLower.some((c) => c.startsWith("description")) &&
    headerLower.some((c) => c.startsWith("amount"));

  if (
    hasBank1Header ||
    hasBank2Header ||
    hasChaseHeader ||
    hasSimpleHeader ||
    hasDateDescAmountHeader
  ) {
    startIndex = 1; // skip header row
  }

  // ----- Parse data lines ----------------------------------------------------------------

  for (let i = startIndex; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    const cols = splitCsvLine(raw).map((c) =>
      c.trim().replace(/^"|"$/g, "")
    );
    if (cols.length < 3) continue;

    /* ===== Bank format #1: ExportedTransactions.csv ===== */
    if (bank1) {
      const { postingIdx, txnTypeIdx, amountIdx, descIdx } = bank1;
      if (
        postingIdx < cols.length &&
        txnTypeIdx < cols.length &&
        amountIdx < cols.length
      ) {
        const postingRaw = cols[postingIdx];
        const txnTypeRaw = cols[txnTypeIdx];
        const amountRaw = cols[amountIdx];
        const descRaw = descIdx >= 0 && descIdx < cols.length ? cols[descIdx] : "";

        let amount = parseFloat(amountRaw.replace(/,/g, ""));
        if (!Number.isFinite(amount)) continue;

        // convert MM/DD/YYYY -> YYYY-MM-DD
        let date = postingRaw;
        const m = postingRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) {
          const mm = m[1].padStart(2, "0");
          const dd = m[2].padStart(2, "0");
          date = `${m[3]}-${mm}-${dd}`;
        }

        const txnTypeLower = txnTypeRaw.toLowerCase();
        const type =
          txnTypeLower === "credit" || amount > 0 ? "income" : "expense";

        result.push({
          id: idCounter++,
          date,
          description: descRaw,
          type,
          amount: Math.abs(amount),
        });
      }
      continue; // we handled this line
    }

    /* ===== Bank format #2: Money Market Transactions.csv ===== */
    if (bank2) {
      const { dateIdx, descIdx, amountIdx } = bank2;
      if (
        dateIdx < cols.length &&
        amountIdx < cols.length &&
        descIdx < cols.length
      ) {
        const dateRaw = cols[dateIdx];
        const descRaw = cols[descIdx];
        const amountCell = cols[amountIdx];

        const negative = amountCell.includes("(");
        const cleaned = amountCell.replace(/[\$,()]/g, "");
        let amount = parseFloat(cleaned);
        if (!Number.isFinite(amount)) continue;
        if (negative) amount = -amount;

        let date = dateRaw;
        const m = dateRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) {
          const mm = m[1].padStart(2, "0");
          const dd = m[2].padStart(2, "0");
          date = `${m[3]}-${mm}-${dd}`;
        }

        const type = amount >= 0 ? "income" : "expense";

        result.push({
          id: idCounter++,
          date,
          description: descRaw,
          type,
          amount: Math.abs(amount),
        });
      }
      continue; // handled as bank2
    }

        /* ===== Bank format #3: Chase credit card CSV ===== */
    if (chase) {
      const { dateIdx, descIdx, amountIdx, typeIdx } = chase;

      if (
        dateIdx < cols.length &&
        descIdx < cols.length &&
        amountIdx < cols.length
      ) {
        const dateRaw = cols[dateIdx];
        const descRaw = cols[descIdx];
        const amountRaw = cols[amountIdx];
        const typeRaw =
          typeIdx >= 0 && typeIdx < cols.length ? cols[typeIdx] : "";

        // parse amount (e.g. "-59.95")
        let amount = parseFloat(amountRaw.replace(/,/g, ""));
        if (!Number.isFinite(amount)) {
          continue;
        }

        // convert MM/DD/YYYY -> YYYY-MM-DD
        let date = dateRaw;
        const m = dateRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) {
          const mm = m[1].padStart(2, "0");
          const dd = m[2].padStart(2, "0");
          date = `${m[3]}-${mm}-${dd}`;
        }

        // Determine income vs expense
        const tLower = typeRaw.toLowerCase();
        let type = "expense";
        if (
          amount > 0 ||
          tLower.includes("payment") ||
          tLower.includes("refund") ||
          tLower.includes("credit")
        ) {
          type = "income";
        }

        result.push({
          id: idCounter++,
          date,
          description: descRaw,
          type,
          amount: Math.abs(amount),
        });
      }

      continue; // this row handled by Chase parser
    }

    /* ===== Simple format A: Type, Description, Amount, Date ===== */
    const firstLower = cols[0].toLowerCase();
    if (
      (firstLower === "income" || firstLower === "expense") &&
      cols.length >= 4
    ) {
      const [typeRaw, desc, amountRaw, dateRaw] = cols;
      let amount = parseFloat(amountRaw.replace(/,/g, ""));
      if (!Number.isFinite(amount)) continue;

      const type = typeRaw.toLowerCase() === "income" ? "income" : "expense";
      const date = dateRaw;

      result.push({
        id: idCounter++,
        date,
        description: desc,
        type,
        amount: Math.abs(amount),
      });
      continue;
    }

    /* ===== Simple format B: Date, Description, Amount (YYYY-MM-DD) ===== */
    if (isIsoDate(cols[0])) {
      const [dateRaw, desc, amountRaw] = cols;
      let amount = parseFloat(amountRaw.replace(/,/g, ""));
      if (!Number.isFinite(amount)) continue;

      const type = amount >= 0 ? "income" : "expense";
      const date = dateRaw;

      result.push({
        id: idCounter++,
        date,
        description: desc,
        type,
        amount: Math.abs(amount),
      });
      continue;
    }

    /* ===== Fallback format C: Description, 20251130:xxxx, Amount ===== */
    // Used for some older exports where 2nd col is YYYYMMDD:...
    if (/^\d{8}:/.test(cols[1])) {
      const desc = cols[0];
      const code = cols[1];
      const amountRaw = cols[2];

      let amount = parseFloat(amountRaw.replace(/,/g, ""));
      if (!Number.isFinite(amount)) continue;

      const dateDigits = code.slice(0, 8); // YYYYMMDD
      const date =
        dateDigits.slice(0, 4) +
        "-" +
        dateDigits.slice(4, 6) +
        "-" +
        dateDigits.slice(6, 8);

      const type = amount >= 0 ? "income" : "expense";

      result.push({
        id: idCounter++,
        date,
        description: desc,
        type,
        amount: Math.abs(amount),
      });
      continue;
    }

    // Any other pattern is ignored.
  }

  return result;
}
