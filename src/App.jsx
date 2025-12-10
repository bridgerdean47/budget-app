import { useState, useEffect } from "react";

/* ---------- Demo Goals ---------- */

const goals = [
  {
    id: 1,
    label: "Japan Trip",
    code: "JP",
    planPerMonth: 270,
    current: 3500,
    target: 5000,
  },
  {
    id: 2,
    label: "Subaru Loan",
    code: "SB",
    planPerMonth: 400,
    current: 0,
    target: 16232.96,
  },
];

/* ---------- Main App ---------- */

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const theme = "dark"; // hard-lock to dark theme
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("all"); // "all" or "YYYY-MM"

  const isDark = theme === "dark";

  /* ---------- LocalStorage ---------- */

  // Load once
  useEffect(() => {
    try {
      const saved = localStorage.getItem("transactions");
      if (saved) {
        setTransactions(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Error reading saved transactions", err);
    }
  }, []);

  // Save on change
  useEffect(() => {
    try {
      localStorage.setItem("transactions", JSON.stringify(transactions));
    } catch (err) {
      console.error("Error saving transactions", err);
    }
  }, [transactions]);

  /* ---------- Month filtering + summary ---------- */

  const filteredTransactions =
    selectedMonth === "all"
      ? transactions
      : transactions.filter(
          (t) => t.date && t.date.startsWith(selectedMonth)
        );

  const income = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const payments = filteredTransactions
    .filter((t) => t.type === "payment")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const leftover = income - expenses - payments;

  function formatMonthLabel(key) {
    if (key === "all") return "All Months";
    const [year, month] = key.split("-");
    const names = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const idx = parseInt(month, 10) - 1;
    if (Number.isNaN(idx) || idx < 0 || idx > 11) return key;
    return `${names[idx]} ${year}`;
  }

  const monthSummary = {
    monthLabel: formatMonthLabel(selectedMonth),
    income,
    expenses,
    payments,
    leftover,
  };

  /* ---------- Styles (Black + Red theme) ---------- */

  const appClass = "min-h-screen bg-[#050505] text-gray-100";

  const headerClass =
    "border-b sticky top-0 z-50 backdrop-blur bg-[#050505cc] border-red-900";

const navActive =
  "px-4 py-1 rounded-full border border-red-500 bg-red-500/10 text-red-300 " +
  "transition transform hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(248,113,113,0.7)]";

const navInactive =
  "px-4 py-1 rounded-full border border-gray-700 text-gray-300 " +
  "transition transform hover:-translate-y-0.5 hover:border-red-500 hover:text-red-300 " +
  "hover:shadow-[0_0_16px_rgba(248,113,113,0.5)]";

const cardClass =
  "rounded-3xl p-6 border bg-[#080808] border-red-900 shadow-[0_0_40px_rgba(0,0,0,0.7)] " +
  "transition-transform transition-shadow duration-200 " +
  "hover:-translate-y-1 hover:border-red-500 hover:shadow-[0_0_40px_rgba(248,113,113,0.55)]";


  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "budget", label: "Budget" },
    { id: "transactions", label: "Transactions" },
    { id: "goals", label: "Goals" },
  ];

  /* ---------- Render ---------- */

  return (
    <div className={appClass}>
      {/* HEADER */}
      <header className={headerClass}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xs font-semibold tracking-[0.25em] text-red-400">
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
</div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {activeTab === "dashboard" && (
          <DashboardPage
            theme={theme}
            cardClass={cardClass}
            monthSummary={monthSummary}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
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
            onUpdateTransaction={(updated) =>
              setTransactions((prev) =>
                prev.map((t) => (t.id === updated.id ? updated : t))
              )
            }
          />
        )}

        {activeTab === "goals" && <GoalsPage cardClass={cardClass} />}
      </main>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function DashboardPage({
  theme,
  cardClass,
  monthSummary,
  selectedMonth,
  onMonthChange,
}) {
  const isDark = theme === "dark";

  const allocationPercent =
    monthSummary.income > 0
      ? ((monthSummary.expenses + monthSummary.payments) /
          monthSummary.income) *
        100
      : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-100">
            {monthSummary.monthLabel}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-400">
            Overview of this month&apos;s money flow
          </p>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="text-xs rounded-full border border-gray-700 bg-[#050505] px-3 py-1 outline-none text-gray-200"
          >
            <option value="all">All months</option>
            {/* You can add specific months you care about */}
            <option value="2025-11">Nov 2025</option>
            <option value="2025-12">Dec 2025</option>
          </select>
        </div>
      </div>

      <section className={cardClass}>
        <h3 className="mb-4 text-xs font-semibold tracking-[0.28em] text-red-400">
          MONTH OVERVIEW
        </h3>

        <div className="grid gap-6 md:grid-cols-4">
<OverviewStat
  label="INCOME"
  value={monthSummary.income}
  color="text-green-400"
/>
<OverviewStat
  label="EXPENSES"
  value={monthSummary.expenses}
  color="text-red-500"
/>
<OverviewStat
  label="PAYMENTS"
  value={monthSummary.payments}
  color="text-yellow-400"
/>
<OverviewStat
  label="LEFTOVER"
  value={monthSummary.leftover}
  color="text-white"
/>
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-[0.16em]">
            Allocation this month
          </p>

          <div className="h-2 w-full overflow-hidden rounded-full bg-black">
            <div
              className="h-full transition-all duration-700 bg-gradient-to-r from-red-700 via-red-500 to-red-600"
              style={{ width: `${Math.min(100, allocationPercent)}%` }}
            />
          </div>
        </div>
      </section>

      <CashFlowSankey theme={theme} income={monthSummary.income} />

      <section>
        <h3 className="mb-4 text-xs font-semibold tracking-[0.28em] text-red-400">
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

/* ---------- Budget ---------- */

function BudgetPage({ cardClass, monthSummary }) {
  const { income, expenses, payments, leftover } = monthSummary;

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold text-gray-100">Budget</h2>
      <p className="text-gray-400 text-sm">
        High-level breakdown of this month&apos;s plan.
      </p>

      <section className={cardClass}>
        <h3 className="text-sm font-medium mb-3 text-red-300">Totals</h3>
        <ul className="space-y-1 text-sm text-gray-200">
          <li>Income: ${income.toFixed(2)}</li>
          <li>Expenses: ${expenses.toFixed(2)}</li>
          <li>Payments: ${payments.toFixed(2)}</li>
          <li>Leftover: ${leftover.toFixed(2)}</li>
        </ul>
      </section>
    </div>
  );
}

/* ---------- Transactions + modal editing ---------- */

function TransactionsPage({
  theme,
  cardClass,
  transactions,
  onAddTransactions,
  onUpdateTransaction,
}) {
  const [file, setFile] = useState(null);
  const [editing, setEditing] = useState(null);

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
        <h2 className="text-3xl font-bold text-gray-100">Transactions</h2>
        <p className="text-gray-400 text-sm">
          Upload a bank CSV or click a row to edit it.
        </p>
      </div>

      <section className={cardClass}>
        <h3 className="text-xs font-semibold tracking-[0.28em] text-red-400">
          BANK STATEMENT IMPORT (CSV)
        </h3>

        <p className="mt-3 text-xs text-gray-400">
          Supported formats:
          <br />
          1) Type, Description, Amount, Date
          <br />
          2) Date, Description, Amount
          <br />
          3) Chase credit card CSV
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
<label className="inline-flex cursor-pointer flex-col gap-2">
  <span
    className={
      "inline-flex items-center justify-center rounded-full border px-4 py-1.5 border-red-500 bg-red-500/10 text-red-300 " +
      "transition transform hover:-translate-y-0.5 hover:bg-red-500 hover:text-black " +
      "hover:shadow-[0_0_20px_rgba(248,113,113,0.7)]"
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
  className="rounded-full border px-4 py-1.5 text-xs border-red-500 text-red-300 transition transform hover:-translate-y-0.5 hover:bg-red-500 hover:text-black hover:shadow-[0_0_20px_rgba(248,113,113,0.7)]"
>
  Import CSV
</button>

          {file && (
            <span className="text-[0.7rem] text-gray-400">
              Selected: {file.name}
            </span>
          )}
        </div>
      </section>

      <section className={cardClass}>
        <h3 className="mb-3 text-sm font-medium text-red-300">
          Imported transactions ({transactions.length})
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-red-900/60">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#111111] text-gray-200 border-b border-red-900">
                <th className="px-4 py-3 text-left font-semibold">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Description
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Amount
                </th>
              </tr>
            </thead>
<tbody>
  {transactions.map((t) => (
    <tr
      key={t.id}
      onClick={() => setEditing(t)}
      className="cursor-pointer border-b border-gray-800 transition-colors transform hover:bg-[#111111] hover:translate-x-1"
    >
      <td className="px-4 py-2 text-gray-200">{t.date}</td>
      <td className="px-4 py-2 text-gray-100">{t.description}</td>

      <td
        className={
          "px-4 py-2 " +
          (t.type === "income"
            ? "text-green-400"
            : t.type === "payment"
            ? "text-yellow-400"
            : "text-red-500")
        }
      >
        {t.type === "income"
          ? "Income"
          : t.type === "payment"
          ? "Payment"
          : "Expense"}
      </td>

      <td className="px-4 py-2 text-gray-100">
        ${t.amount.toFixed(2)}
      </td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      </section>

      {/* Modal editor */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#101010] rounded-xl p-6 w-full max-w-md shadow-xl space-y-4 border border-red-700">
            <h3 className="text-xl font-semibold mb-2 text-gray-100">
              Edit Transaction
            </h3>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Description</label>
              <input
                type="text"
                className="w-full p-2 rounded bg-black text-gray-100 border border-gray-800"
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Date</label>
              <input
                type="text"
                className="w-full p-2 rounded bg-black text-gray-100 border border-gray-800"
                value={editing.date}
                onChange={(e) =>
                  setEditing({ ...editing, date: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Type</label>
              <select
                className="w-full p-2 rounded bg-black text-gray-100 border border-gray-800"
                value={editing.type}
                onChange={(e) =>
                  setEditing({ ...editing, type: e.target.value })
                }
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="payment">Payment</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Amount</label>
              <input
                type="number"
                className="w-full p-2 rounded bg-black text-gray-100 border border-gray-800"
                value={editing.amount}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                className="px-4 py-2 rounded bg-gray-800 text-gray-100 hover:bg-gray-700"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500"
                onClick={() => {
                  onUpdateTransaction(editing);
                  setEditing(null);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Goals tab ---------- */

function GoalsPage({ cardClass }) {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold text-gray-100">Goals</h2>
      <p className="text-gray-400 text-sm">
        We will add goal creation / editing here later.
      </p>

      <section className={cardClass}>
        <p className="text-gray-400 text-sm">
          For now, goals are visible on the Dashboard.
        </p>
      </section>
    </div>
  );
}

/* ---------- Cash-flow Sankey ---------- */

function CashFlowSankey({ theme, income }) {
  const isDark = theme === "dark";

  if (!income || income <= 0) return null;

const flows = [
  {
    id: "savings",
    label: "Savings",
    share: 0.33,
    colorDark: "#4ade80", // green-400
    colorLight: "#4ade80",
  },
  {
    id: "fixed",
    label: "Fixed",
    share: 0.38,
    colorDark: "#ef4444", // red-500
    colorLight: "#ef4444",
  },
  {
    id: "disc",
    label: "Discretionary",
    share: 0.29,
    colorDark: "#facc15", // yellow-400
    colorLight: "#facc15",
  },
];


  const slices = flows.map((f) => ({
    ...f,
    value: income * f.share,
  }));

  const total = slices.reduce((s, x) => s + x.value, 0);

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
    <section className="mt-2 rounded-3xl border border-red-900 bg-black p-4">
      <h3 className="mb-2 text-xs font-semibold tracking-[0.28em] text-red-400">
        CASH FLOW
      </h3>

      <div className="rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-6 bg-[#050505]">
        <div className="flex justify-center items-center">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle
              cx={cx}
              cy={cy}
              r={outerRadius}
              fill={isDark ? "#050505" : "#e7ebdd"}
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
                  stroke={isDark ? "#050505" : "#e7ebdd"}
                  strokeWidth={1}
                />
              );
            })}

            <circle
              cx={cx}
              cy={cy}
              r={innerRadius - 6}
              fill={isDark ? "#050505" : "#f4f3ec"}
            />
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              fill={isDark ? "#e5e7eb" : "#111827"}
            >
              Income
            </text>
            <text
              x={cx}
              y={cy + 12}
              textAnchor="middle"
              fill={isDark ? "#e5e7eb" : "#111827"}
            >
              ${income.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </text>
          </svg>
        </div>

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
                  <span className="font-medium text-gray-100">
                    {slice.label}
                  </span>
                </div>
                <div className="text-right text-gray-400">
                  <span className="mr-2">
                    $
                    {slice.value.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
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
      <p className="text-[0.7rem] tracking-[0.18em] text-gray-400">
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
    "rounded-2xl p-4 border flex flex-col gap-3 transition-transform transition-shadow duration-200 " +
    (isDark
      ? "bg-[#050505] border-red-900 hover:border-red-500 hover:shadow-[0_0_30px_rgba(248,113,113,0.4)] hover:-translate-y-1"
      : "bg-slate-100")
  }
>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold bg-red-500/15 text-red-300">
            {goal.code}
          </div>
          <div>
            <h4 className="font-medium text-gray-100">{goal.label}</h4>
            <p className="text-xs text-gray-400">
              Plan: ${goal.planPerMonth}/mo
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-200">
          ${goal.current} / ${goal.target}
        </p>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-black">
<div
  className={
    "h-full transition-all duration-700 " +
    (p >= 80 ? "bg-green-400" : "bg-red-500")
  }
  style={{ width: `${p}%` }}
/>
      </div>
    </div>
  );
}

/* ---------- CSV helpers ---------- */

function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];

    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
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
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}

function parseCsv(text, startId = 0) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];

  const result = [];
  let idCounter = startId + 1;

  let startIndex = 0;
  let headerCols = [];
  let headerLower = [];

  if (lines.length > 0) {
    headerCols = splitCsvLine(lines[0]).map((c) =>
      c.trim().replace(/^"|"$/g, "")
    );
    headerLower = headerCols.map((c) => c.toLowerCase());
  }

  // Example “bank1” format: Posting Date, Transaction Type, Amount, Description...
  const hasBank1Header =
    headerLower.includes("posting date") &&
    headerLower.includes("transaction type") &&
    headerLower.some((c) => c === "amount" || c.startsWith("amount"));

  let bank1 = null;
  if (hasBank1Header) {
    bank1 = {
      postingIdx: headerLower.indexOf("posting date"),
      txnTypeIdx: headerLower.indexOf("transaction type"),
      amountIdx: headerLower.findIndex(
        (c) => c === "amount" || c.startsWith("amount")
      ),
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

  // Example “bank2” format: Account ID, Transaction ID, Date, Description, Amount...
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
      amountIdx: headerLower.findIndex(
        (c) => c === "amount" || c.startsWith("amount")
      ),
    };
  }

  // Chase credit card CSV: Transaction Date, Post Date, Description, Category, Type, Amount, Memo
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
      typeIdx: headerLower.indexOf("type"),
    };
  }

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
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    const cols = splitCsvLine(raw).map((c) =>
      c.trim().replace(/^"|"$/g, "")
    );
    if (cols.length < 3) continue;

    /* Bank format 1 */
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
        const descRaw =
          descIdx >= 0 && descIdx < cols.length ? cols[descIdx] : "";

        let amount = parseFloat(amountRaw.replace(/,/g, ""));
        if (!Number.isFinite(amount)) continue;

        let date = postingRaw;
        const m = postingRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) {
          const mm = m[1].padStart(2, "0");
          const dd = m[2].padStart(2, "0");
          date = `${m[3]}-${mm}-${dd}`;
        }

        const typeLower = txnTypeRaw.toLowerCase();
        const type =
          typeLower === "credit" || amount > 0 ? "income" : "expense";

        result.push({
          id: idCounter++,
          date,
          description: descRaw,
          type,
          amount: Math.abs(amount),
        });
      }
      continue;
    }

    /* Bank format 2 */
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
      continue;
    }

    /* Chase credit card */
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

        let amount = parseFloat(amountRaw.replace(/,/g, ""));
        if (!Number.isFinite(amount)) continue;

        let date = dateRaw;
        const m = dateRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) {
          const mm = m[1].padStart(2, "0");
          const dd = m[2].padStart(2, "0");
          date = `${m[3]}-${mm}-${dd}`;
        }

        const descLower = descRaw.toLowerCase();
        const typeLower = typeRaw.toLowerCase();
        let type = "expense";

        if (
          descLower.includes("refund") ||
          descLower.includes("credit") ||
          typeLower.includes("refund") ||
          typeLower.includes("credit")
        ) {
          type = "income";
        } else if (descLower.includes("payment")) {
          // e.g. "Payment Thank You-Mobile"
          type = "payment";
        } else if (amount < 0) {
          type = "expense";
        } else {
          type = "expense";
        }

        result.push({
          id: idCounter++,
          date,
          description: descRaw,
          type,
          amount: Math.abs(amount),
        });
      }
      continue;
    }

    /* Simple format A: Type, Description, Amount, Date */
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

    /* Simple format B: Date, Description, Amount (YYYY-MM-DD) */
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

    /* Fallback format C: Description, 20251130:xxxx, Amount */
    if (/^\d{8}:/.test(cols[1])) {
      const desc = cols[0];
      const code = cols[1];
      const amountRaw = cols[2];

      let amount = parseFloat(amountRaw.replace(/,/g, ""));
      if (!Number.isFinite(amount)) continue;

      const dateDigits = code.slice(0, 8);
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
  }

  return result;
}
