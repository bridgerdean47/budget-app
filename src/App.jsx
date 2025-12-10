import { useState } from "react";
/* ---------- Demo data ---------- */

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
          <DashboardPage theme={theme} cardClass={cardClass} />
        )}

        {activeTab === "budget" && <BudgetPage cardClass={cardClass} />}

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

function DashboardPage({ theme, cardClass }) {
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
      <CashFlowSankey theme={theme} />

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

function BudgetPage({ cardClass }) {
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

function CashFlowSankey({ theme }) {
  const isDark = theme === "dark";

  // Simple demo structure: Income -> Savings / Fixed / Discretionary
  const totalIncome = 4500;

  const midNodes = [
    { id: "savings", label: "Savings", value: 1500, colorDark: "#22c55e", colorLight: "#15803d" },
    { id: "fixed", label: "Fixed", value: 1700, colorDark: "#fb7185", colorLight: "#b91c1c" },
    { id: "disc", label: "Discretionary", value: 1300, colorDark: "#eab308", colorLight: "#a16207" },
  ];

  const height = 260;
  const width = 800;

  // Layout positions
  const leftX = 70;
  const midX = 340;
  const rightLabelX = 380;

  // Compute ranges for the middle column stacked vertically
  const padding = 10;
  const usableHeight = height - 2 * padding;
  let offsetY = padding;

  const midPositions = midNodes.map((node) => {
    const h = (node.value / totalIncome) * usableHeight;
    const yCenter = offsetY + h / 2;
    const res = { ...node, h, yCenter };
    offsetY += h;
    return res;
  });

  return (
    <section className="mt-2 rounded-3xl border border-slate-800 bg-card/80 p-4">
      <h3 className="mb-2 text-xs font-semibold tracking-[0.28em] text-neutralSoft">
        CASH FLOW
      </h3>

      <div className="overflow-hidden rounded-2xl bg-black/10">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-64"
          role="img"
        >
          {/* Background */}
          <rect
            x="0"
            y="0"
            width={width}
            height={height}
            fill={isDark ? "#020617" : "#f4f3ec"}
          />

          {/* Income bar on the left */}
          <rect
            x={leftX - 12}
            y={padding}
            width={24}
            height={usableHeight}
            rx={12}
            fill={isDark ? "#06b6d4" : "#0f766e"}
          />

          <text
            x={leftX}
            y={padding - 6}
            textAnchor="middle"
            fontSize="12"
            fill={isDark ? "#e5e7eb" : "#111827"}
          >
            Income
          </text>

          {/* Curved ribbons from Income to each category */}
          {midPositions.map((node, index) => {
            const startY = padding + usableHeight / 2;
            const endY = node.yCenter;
            const strokeWidth = (node.value / totalIncome) * usableHeight;

            const color = isDark ? node.colorDark : node.colorLight;

            const d = `
              M ${leftX + 12} ${startY}
              C ${(leftX + midX) / 2} ${startY},
                ${(leftX + midX) / 2} ${endY},
                ${midX - 20} ${endY}
            `;

            return (
              <g key={node.id}>
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeOpacity={0.55}
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {/* Middle column bars and labels */}
          {midPositions.map((node) => {
            const barHeight = node.h * 0.7; // slightly thinner than ribbon
            const barY = node.yCenter - barHeight / 2;
            const color = isDark ? node.colorDark : node.colorLight;

            return (
              <g key={node.id}>
                <rect
                  x={midX - 14}
                  y={barY}
                  width={28}
                  height={barHeight}
                  rx={14}
                  fill={color}
                />
                <text
                  x={rightLabelX}
                  y={node.yCenter - 6}
                  fontSize="12"
                  fill={isDark ? "#e5e7eb" : "#111827"}
                >
                  {node.label}
                </text>
                <text
                  x={rightLabelX}
                  y={node.yCenter + 10}
                  fontSize="11"
                  fill={isDark ? "#9ca3af" : "#4b5563"}
                >
                  ${node.value.toLocaleString()}
                </text>
              </g>
            );
          })}
        </svg>
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

/* ---------- CSV helper ---------- */

function parseCsv(text, startId = 0) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length <= 1) return [];

  const result = [];
  let idCounter = startId + 1;

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    const cols = raw.split(",").map((c) => c.trim());
    if (cols.length < 3) continue;

    // Format 1: Type, Description, Amount, Date
    if (cols.length >= 4) {
      const [typeRaw, desc, amountRaw, date] = cols;
      const amount = parseFloat(amountRaw);
      if (!Number.isFinite(amount)) continue;

      const type =
        typeRaw.toLowerCase() === "income" ? "income" : "expense";

      result.push({
        id: idCounter++,
        date,
        description: desc,
        type,
        amount: Math.abs(amount),
      });
    } else {
      // Format 2: Date, Description, Amount
      const [date, desc, amountRaw] = cols;
      const amount = parseFloat(amountRaw);
      if (!Number.isFinite(amount)) continue;

      const type = amount >= 0 ? "income" : "expense";

      result.push({
        id: idCounter++,
        date,
        description: desc,
        type,
        amount: Math.abs(amount),
      });
    }
  }

  return result;
}
