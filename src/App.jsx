import { useState, useEffect, useRef, useMemo } from "react";

const TRANSACTIONS_KEY = "bm-transactions-v1";
const GOALS_KEY = "bm-goals-v1";

/* ---------- Demo Goals ---------- */

const defaultGoals = [
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


/* ---------- Budget helpers ---------- */

const defaultBudget = {
  monthLabel: "January 2026",
  income: [
    { id: 1, label: "Paycheck", amount: 3800 },
    { id: 2, label: "Side Work", amount: 700 },
  ],
  fixed: [
    { id: 3, label: "Rent", amount: 1400 },
    { id: 4, label: "Utilities", amount: 250 },
    { id: 5, label: "Car (Azera)", amount: 300 },
    { id: 6, label: "Car (Rogue)", amount: 220 },
    { id: 7, label: "Phone", amount: 90 },
    { id: 8, label: "Subscriptions", amount: 70 },
  ],
  variable: [
    { id: 9, label: "Groceries", amount: 400 },
    { id: 10, label: "Gas", amount: 200 },
    { id: 11, label: "Eating Out", amount: 150 },
    { id: 12, label: "Fun Money", amount: 100 },
  ],
};

function getBudgetTotals(budget) {
  const sum = (arr) =>
    (arr || []).reduce((s, item) => s + (Number(item.amount) || 0), 0);

  const totalIncome = sum(budget.income);
  const totalFixed = sum(budget.fixed);
  const totalVariable = sum(budget.variable);
  const remainingForGoals = totalIncome - totalFixed - totalVariable;

  return { totalIncome, totalFixed, totalVariable, remainingForGoals };
}

function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

/* ---------- Main App ---------- */

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState("dark");
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("all");

  // ---------- Goals State ----------
  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem(GOALS_KEY);
      return saved ? JSON.parse(saved) : defaultGoals;
    } catch {
      return defaultGoals;
    }
  });

  // Budget state
  const [budget, setBudget] = useState(() => {
    try {
      const saved = localStorage.getItem("budget-v1");
      return saved ? JSON.parse(saved) : defaultBudget;
    } catch {
      return defaultBudget;
    }
  });

  const budgetTotals = getBudgetTotals(budget);

  const isDark = theme === "dark";

  /* ---------- LocalStorage ---------- */

  // Load transactions once on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TRANSACTIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTransactions(parsed);
        } else {
          console.warn("Saved transactions is not an array, clearing it.");
          localStorage.removeItem(TRANSACTIONS_KEY);
        }
      }
    } catch (err) {
      console.error("Error reading saved transactions", err);
      localStorage.removeItem(TRANSACTIONS_KEY);
    }
  }, []);

  // Save transactions whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (err) {
      console.error("Error saving transactions", err);
    }
  }, [transactions]);

  // Save budget
  useEffect(() => {
    try {
      localStorage.setItem("budget-v1", JSON.stringify(budget));
    } catch (err) {
      console.error("Error saving budget", err);
    }
  }, [budget]);

  // Save goals
useEffect(() => {
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  } catch (err) {
    console.error("Error saving goals", err);
  }
}, [goals]);

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

  const transfers = filteredTransactions
    .filter((t) => t.type === "transfer")
    .reduce((sum, t) => sum + t.amount, 0);

  // Transfers DO NOT affect leftover
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
    transfers,
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
    { id: "budget", label: "Estimate" },
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
              B&M BUDGET
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
            budgetTotals={budgetTotals}
            goals={goals}
          />
        )}

        {activeTab === "budget" && (
          <BudgetPage
            cardClass={cardClass}
            monthSummary={monthSummary}
            budget={budget}
            setBudget={setBudget}
            budgetTotals={budgetTotals}
          />
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

        {activeTab === "goals" && (
  <GoalsPage cardClass={cardClass} goals={goals} setGoals={setGoals} />
)}
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
  budgetTotals,
  goals,
}) {
  const allocationPercent =
    monthSummary.income > 0
      ? ((monthSummary.expenses + monthSummary.payments) /
          monthSummary.income) *
        100
      : 0;

  const totalSpending = monthSummary.expenses + monthSummary.payments;

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

        {budgetTotals && (
          <p className="mt-4 text-xs text-gray-400">
            Budget remaining for goals:{" "}
            <span className="text-white">
              {formatCurrency(budgetTotals.remainingForGoals)}
            </span>
          </p>
        )}

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

      <CashFlowBar
        theme={theme}
        income={monthSummary.income}
        spending={totalSpending}
      />

      <section>
        <h3 className="mb-4 text-xs font-semibold tracking-[0.28em] text-red-400">
          GOALS
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
              {(goals || []).map((goal) => (
      <GoalCard key={goal.id} goal={goal} theme={theme} />
    ))}
        </div>
      </section>
    </div>
  );
}

/* ---------- Spending Estimate / Budget tab ---------- */

function BudgetPage({ cardClass, monthSummary, budget, setBudget, budgetTotals }) {
  const monthLabel = budget.monthLabel || monthSummary.monthLabel;

  const { totalIncome, totalFixed, totalVariable, remainingForGoals } =
    budgetTotals || {
      totalIncome: 0,
      totalFixed: 0,
      totalVariable: 0,
      remainingForGoals: 0,
    };

  const plannedLeftAfterBills = totalIncome - totalFixed;
  const actualIncome = monthSummary.income;
  const actualSpending = monthSummary.expenses + monthSummary.payments;
  const estimatedSavings = totalIncome - totalFixed - actualSpending;

  const handleAddItem = (listKey) => {
    setBudget((prev) => {
      const nextId = Date.now();
      const nextList = [
        ...(prev[listKey] || []),
        { id: nextId, label: "New item", amount: 0 },
      ];
      return { ...prev, [listKey]: nextList };
    });
  };

  const handleUpdateItem = (listKey, id, field, value) => {
    setBudget((prev) => {
      const updated = (prev[listKey] || []).map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      );
      return { ...prev, [listKey]: updated };
    });
  };

  const handleDeleteItem = (listKey, id) => {
    setBudget((prev) => {
      const filtered = (prev[listKey] || []).filter((item) => item.id !== id);
      return { ...prev, [listKey]: filtered };
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-100">
            {monthLabel} Spending Estimate
          </h2>
          <p className="text-gray-400 text-sm">
            Plan your income and bills, then compare to real spending.
          </p>
        </div>
      </header>

      {/* Summary card: planned vs actual */}
      <section className={cardClass}>
        <h3 className="text-xs font-semibold tracking-[0.28em] text-red-400 mb-4">
          ESTIMATE SUMMARY
        </h3>

        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="space-y-1">
            <p className="text-[0.7rem] tracking-[0.16em] text-gray-400 uppercase">
              Planned Income
            </p>
            <p className="text-lg font-semibold text-green-400">
              {formatCurrency(totalIncome)}
            </p>
            <p className="text-[0.7rem] text-gray-500">
              From your income list below.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[0.7rem] tracking-[0.16em] text-gray-400 uppercase">
              Bills (Fixed + Variable)
            </p>
            <p className="text-lg font-semibold text-red-400">
              {formatCurrency(totalFixed + totalVariable)}
            </p>
            <p className="text-[0.7rem] text-gray-500">
              What you expect to spend this month.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[0.7rem] tracking-[0.16em] text-gray-400 uppercase">
              Planned Left After Bills
            </p>
            <p className="text-lg font-semibold text-white">
              {formatCurrency(plannedLeftAfterBills)}
            </p>
            <p className="text-[0.7rem] text-gray-500">
              Income minus fixed bills only.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3 text-sm">
          <div className="space-y-1">
            <p className="text-[0.7rem] tracking-[0.16em] text-gray-400 uppercase">
              Actual Income (Selected Month)
            </p>
            <p className="text-lg font-semibold text-green-400">
              {formatCurrency(actualIncome)}
            </p>
            <p className="text-[0.7rem] text-gray-500">
              From imported transactions.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[0.7rem] tracking-[0.16em] text-gray-400 uppercase">
              Actual Spending + Payments
            </p>
            <p className="text-lg font-semibold text-red-400">
              {formatCurrency(actualSpending)}
            </p>
            <p className="text-[0.7rem] text-gray-500">
              Expenses plus payments this month.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[0.7rem] tracking-[0.16em] text-gray-400 uppercase">
              Estimated Savings
            </p>
            <p className="text-lg font-semibold text-emerald-400">
              {formatCurrency(estimatedSavings)}
            </p>
            <p className="text-[0.7rem] text-gray-500">
              Planned income − bills − actual spending.
            </p>
          </div>
        </div>
      </section>

      {/* Editable budget lists */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Income */}
        <section className={cardClass}>
          <h3 className="text-xs font-semibold tracking-[0.28em] text-gray-400 mb-4">
            INCOME
          </h3>

          <div className="space-y-2 text-sm">
            {(budget.income || []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 text-gray-100"
              >
                <input
                  className="bg-transparent border-b border-transparent focus:border-gray-600 outline-none text-sm flex-1"
                  value={item.label}
                  onChange={(e) =>
                    handleUpdateItem("income", item.id, "label", e.target.value)
                  }
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="bg-transparent border-b border-transparent focus:border-gray-600 outline-none text-right w-24 text-sm"
                    value={item.amount}
                    onChange={(e) =>
                      handleUpdateItem(
                        "income",
                        item.id,
                        "amount",
                        Number(e.target.value) || 0
                      )
                    }
                  />
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-red-400"
                    onClick={() => handleDeleteItem("income", item.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-400 uppercase tracking-[0.16em]">
              TOTAL
            </span>
            <span className="text-green-400 font-semibold">
              {formatCurrency(totalIncome)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleAddItem("income")}
            className="mt-4 inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-green-500 text-xs text-green-300 
                       hover:bg-green-500 hover:text-black transition"
          >
            + Add Income Item
          </button>
        </section>

        {/* Fixed expenses */}
        <section className={cardClass}>
          <h3 className="text-xs font-semibold tracking-[0.28em] text-gray-400 mb-4">
            FIXED EXPENSES
          </h3>

          <div className="space-y-2 text-sm">
            {(budget.fixed || []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 text-gray-100"
              >
                <input
                  className="bg-transparent border-b border-transparent focus:border-gray-600 outline-none text-sm flex-1"
                  value={item.label}
                  onChange={(e) =>
                    handleUpdateItem("fixed", item.id, "label", e.target.value)
                  }
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="bg-transparent border-b border-transparent focus:border-gray-600 outline-none text-right w-24 text-sm"
                    value={item.amount}
                    onChange={(e) =>
                      handleUpdateItem(
                        "fixed",
                        item.id,
                        "amount",
                        Number(e.target.value) || 0
                      )
                    }
                  />
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-red-400"
                    onClick={() => handleDeleteItem("fixed", item.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-400 uppercase tracking-[0.16em]">
              TOTAL
            </span>
            <span className="text-red-500 font-semibold">
              {formatCurrency(totalFixed)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleAddItem("fixed")}
            className="mt-4 inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-red-500 text-xs text-red-300 
                       hover:bg-red-500 hover:text-black transition"
          >
            + Add Fixed Expense
          </button>
        </section>

        {/* Variable spending */}
        <section className={cardClass}>
          <h3 className="text-xs font-semibold tracking-[0.28em] text-gray-400 mb-4">
            VARIABLE SPENDING
          </h3>

          <div className="space-y-2 text-sm">
            {(budget.variable || []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 text-gray-100"
              >
                <input
                  className="bg-transparent border-b border-transparent focus:border-gray-600 outline-none text-sm flex-1"
                  value={item.label}
                  onChange={(e) =>
                    handleUpdateItem(
                      "variable",
                      item.id,
                      "label",
                      e.target.value
                    )
                  }
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="bg-transparent border-b border-transparent focus:border-gray-600 outline-none text-right w-24 text-sm"
                    value={item.amount}
                    onChange={(e) =>
                      handleUpdateItem(
                        "variable",
                        item.id,
                        "amount",
                        Number(e.target.value) || 0
                      )
                    }
                  />
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-red-400"
                    onClick={() => handleDeleteItem("variable", item.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-400 uppercase tracking-[0.16em]">
              TOTAL
            </span>
            <span className="text-yellow-400 font-semibold">
              {formatCurrency(totalVariable)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleAddItem("variable")}
            className="mt-4 inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-yellow-400 text-xs text-yellow-300 
                       hover:bg-yellow-400 hover:text-black transition"
          >
            + Add Variable Expense
          </button>
        </section>

        {/* Remaining for goals */}
        <section className={cardClass}>
          <h3 className="text-xs font-semibold tracking-[0.28em] text-gray-400 mb-4">
            REMAINING FOR GOALS (BASED ON PLAN)
          </h3>

          <p className="text-3xl font-bold text-white mb-2">
            {formatCurrency(remainingForGoals)}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            This is what&apos;s left after planned income minus all planned
            expenses. Use it for savings, debt, or your Japan trip.
          </p>

          <p className="text-xs text-gray-500">
            Your actual month leftover (using real transactions) is{" "}
            <span className="text-emerald-400 font-semibold">
              {formatCurrency(monthSummary.leftover)}
            </span>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

/* ---------- Transactions ---------- */

function TransactionsPage({
  theme,
  cardClass,
  transactions,
  onAddTransactions,
  onUpdateTransaction,
}) {
  const [editing, setEditing] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const fileInputRef = useRef(null);

  const handleFileSelected = (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setImportMessage("Please choose a .csv file.");
      return;
    }

    setImportMessage(`Reading ${file.name}...`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = parseCsv(text, transactions.length);
      if (!parsed.length) {
        setImportMessage("No valid rows found in CSV.");
      } else {
        onAddTransactions(parsed);
        setImportMessage(
          `Imported ${parsed.length} transactions from ${file.name}.`
        );
      }
    };
    reader.onerror = () => {
      setImportMessage("Error reading file.");
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    handleFileSelected(droppedFile);
  };

  const handleSortClick = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedTransactions = useMemo(() => {
    const data = [...transactions];
    if (!sortConfig.key) return data;

    if (sortConfig.key === "date") {
      data.sort((a, b) => {
        const da = a.date ? new Date(a.date) : new Date(0);
        const db = b.date ? new Date(b.date) : new Date(0);
        const cmp = da - db;
        return sortConfig.direction === "asc" ? cmp : -cmp;
      });
    }

    return data;
  }, [transactions, sortConfig]);

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <span className="text-[0.6rem] text-gray-500">⇅</span>;
    }
    return (
      <span className="text-[0.6rem] text-gray-300">
        {sortConfig.direction === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-100">Transactions</h2>
        <p className="text-gray-400 text-sm">
          Upload a bank CSV or click a row to edit it.
        </p>
      </div>

      {/* IMPORT CARD */}
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

        <div className="mt-4 space-y-3 text-xs">
          {/* Drag & drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={
              "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-6 cursor-pointer transition " +
              (isDragging
                ? "border-red-400 bg-red-500/10"
                : "border-red-700 bg-black/40 hover:border-red-500 hover:bg-red-500/5")
            }
          >
            <p className="text-gray-200 font-medium mb-1">
              Drag &amp; drop a CSV file here
            </p>
            <p className="text-gray-400">
              or <span className="text-red-300 underline">click to browse</span>
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) =>
                handleFileSelected(e.target.files?.[0] || null)
              }
            />
          </div>

          {importMessage && (
            <p className="text-[0.7rem] text-gray-400">{importMessage}</p>
          )}
        </div>
      </section>

      {/* TABLE CARD */}
      <section className={cardClass}>
        <h3 className="mb-3 text-sm font-medium text-red-300">
          Imported transactions ({transactions.length})
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-red-900/60">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#111111] text-gray-200 border-b border-red-900">
                <th className="px-4 py-3 text-left font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSortClick("date")}
                    className="flex items-center gap-1 select-none"
                  >
                    <span>Date</span>
                    {renderSortIcon("date")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Description
                </th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setEditing(t)}
                  className="cursor-pointer border-b border-gray-800 transition-colors transform hover:bg-[#111111] hover:translate-x-1"
                >
                  <td className="px-4 py-2 text-gray-200">{t.date}</td>
                  <td className="px-4 py-2 text-gray-100">
                    {t.description}
                  </td>
                  <td
                    className={
                      "px-4 py-2 " +
                      (t.type === "income"
                        ? "text-green-400"
                        : t.type === "payment"
                        ? "text-yellow-400"
                        : t.type === "transfer"
                        ? "text-blue-400"
                        : "text-red-500")
                    }
                  >
                    {t.type === "income"
                      ? "Income"
                      : t.type === "payment"
                      ? "Payment"
                      : t.type === "transfer"
                      ? "Transfer"
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

      {/* MODAL EDITOR */}
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
                <option value="transfer">Transfer</option>
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

function GoalsPage({ cardClass, goals, setGoals }) {
  const [amounts, setAmounts] = useState({});

  const handleChangeAmount = (id, value) => {
    setAmounts((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleContribute = (id) => {
    const raw = amounts[id];
    const amt = parseFloat(raw);
    if (!amt || amt <= 0) return;

    setGoals((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, current: (Number(g.current) || 0) + amt } : g
      )
    );

    // clear input
    setAmounts((prev) => ({
      ...prev,
      [id]: "",
    }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold text-gray-100">Goals</h2>
      <p className="text-gray-400 text-sm">
        Add contributions to update the dashboard progress bars.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((goal) => {
          const pct = Math.min(
            100,
            Math.round(((Number(goal.current) || 0) / goal.target) * 100)
          );

          return (
            <section key={goal.id} className={cardClass}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                    {goal.code}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-100">
                    {goal.label}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Plan: ${goal.planPerMonth}/mo
                  </p>
                </div>
                <div className="text-right text-sm text-gray-200">
                  <p>
                    ${goal.current} / ${goal.target}
                  </p>
                  <p className="text-xs text-gray-500">{pct}% complete</p>
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-black mb-4">
                <div
                  className={
                    "h-full transition-all duration-700 " +
                    (pct >= 80 ? "bg-green-400" : "bg-red-500")
                  }
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex items-center gap-2 text-sm">
                <input
                  type="number"
                  min="0"
                  placeholder="Amount"
                  className="flex-1 rounded-full bg-black border border-gray-700 px-3 py-1.5 text-xs text-gray-100 outline-none focus:border-red-400"
                  value={amounts[goal.id] ?? ""}
                  onChange={(e) =>
                    handleChangeAmount(goal.id, e.target.value)
                  }
                />
                <button
                  type="button"
                  onClick={() => handleContribute(goal.id)}
                  className="px-4 py-1.5 rounded-full border border-red-500 text-xs text-red-200 hover:bg-red-500 hover:text-black transition"
                >
                  Contribute
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Cash-flow Bar ---------- */

function CashFlowBar({ theme, income, spending }) {
  const [hoverSide, setHoverSide] = useState(null);

  if (!income && !spending) return null;

  const total = income + spending;
  const incomeShare = total > 0 ? income / total : 0.5;
  const spendingShare = total > 0 ? spending / total : 0.5;

  const net = income - spending;
  const isDark = theme === "dark";

  return (
    <section className="mt-2 rounded-3xl border border-red-900 bg-black p-4">
      <h3 className="mb-3 text-xs font-semibold tracking-[0.28em] text-red-400">
        CASH FLOW
      </h3>

      <div className="space-y-3">
        <div className="relative h-6 w-full rounded-full bg-[#020617] overflow-hidden">
          {/* Left (spending) */}
          <div
            className="absolute inset-y-0 left-0 bg-red-600/80 cursor-pointer"
            style={{ width: `${spendingShare * 100}%` }}
            onMouseEnter={() => setHoverSide("spending")}
            onMouseLeave={() => setHoverSide(null)}
            title={`Spending: ${formatCurrency(spending)}`}
          />
          {/* Right (income) */}
          <div
            className="absolute inset-y-0 right-0 bg-green-500/80 cursor-pointer"
            style={{ width: `${incomeShare * 100}%` }}
            onMouseEnter={() => setHoverSide("income")}
            onMouseLeave={() => setHoverSide(null)}
            title={`Income: ${formatCurrency(income)}`}
          />
          {/* Center zero line */}
          <div className="absolute inset-y-1 left-1/2 w-[2px] bg-gray-700/80" />
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-300">
          <span>
            {hoverSide === "income"
              ? `Income this month: ${formatCurrency(income)}`
              : hoverSide === "spending"
              ? `Spending this month: ${formatCurrency(spending)}`
              : `Hover green/red to see exact amounts.`}
          </span>
          <span
            className={
              "font-semibold " +
              (net > 0
                ? "text-emerald-400"
                : net < 0
                ? "text-red-400"
                : "text-gray-200")
            }
          >
            Net: {formatCurrency(net)}
          </span>
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
        let type =
          typeLower === "credit" || amount > 0 ? "income" : "expense";

        // Detect transfers
        const descLower = descRaw.toLowerCase();
        if (
          descLower.includes("transfer") ||
          descLower.includes("xfer") ||
          descLower.includes("share transfer") ||
          descLower.includes("online banking transfer") ||
          descLower.includes("member to member")
        ) {
          type = "transfer";
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

        let type = amount >= 0 ? "income" : "expense";

        const descLower = descRaw.toLowerCase();
        if (
          descLower.includes("transfer") ||
          descLower.includes("xfer") ||
          descLower.includes("share transfer") ||
          descLower.includes("online banking transfer") ||
          descLower.includes("member to member")
        ) {
          type = "transfer";
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
        }

        if (
          descLower.includes("transfer") ||
          descLower.includes("xfer") ||
          descLower.includes("balance transfer")
        ) {
          type = "transfer";
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
      (firstLower === "income" ||
        firstLower === "expense" ||
        firstLower === "payment" ||
        firstLower === "transfer") &&
      cols.length >= 4
    ) {
      const [typeRaw, desc, amountRaw, dateRaw] = cols;
      let amount = parseFloat(amountRaw.replace(/,/g, ""));
      if (!Number.isFinite(amount)) continue;

      let type = "expense";
      const tLower = typeRaw.toLowerCase();
      if (tLower === "income") type = "income";
      else if (tLower === "payment") type = "payment";
      else if (tLower === "transfer") type = "transfer";

      const descLower = desc.toLowerCase();
      if (
        descLower.includes("transfer") ||
        descLower.includes("xfer") ||
        descLower.includes("share transfer") ||
        descLower.includes("online banking transfer") ||
        descLower.includes("member to member")
      ) {
        type = "transfer";
      }

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

      let type = amount >= 0 ? "income" : "expense";

      const descLower = desc.toLowerCase();
      if (
        descLower.includes("transfer") ||
        descLower.includes("xfer") ||
        descLower.includes("share transfer") ||
        descLower.includes("online banking transfer") ||
        descLower.includes("member to member")
      ) {
        type = "transfer";
      }

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

      let type = amount >= 0 ? "income" : "expense";

      const descLower = desc.toLowerCase();
      if (
        descLower.includes("transfer") ||
        descLower.includes("xfer") ||
        descLower.includes("share transfer") ||
        descLower.includes("online banking transfer") ||
        descLower.includes("member to member")
      ) {
        type = "transfer";
      }

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
