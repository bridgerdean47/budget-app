import { useState, useEffect, useRef, useMemo } from "react";
import DashboardPage from "./pages/DashboardPage.jsx";
import BudgetPage from "./pages/BudgetPage.jsx";
import TransactionsPage from "./pages/TransactionsPage.jsx";
import GoalsPage from "./pages/GoalsPage.jsx";
import CashFlowBar from "./components/CashFlowBar.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";

const TRANSACTIONS_KEY = "bm-transactions-v1";
const GOALS_KEY = "bm-goals-v1";


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
    { id: 1, label: "Bridger Paycheck", amount: 2000 },
    { id: 2, label: "Morgin Paycheck", amount: 3000 },
  ],
  fixed: [
    { id: 3, label: "Rent", amount: 863 },
    { id: 4, label: "Utilities", amount: 80 },
    { id: 5, label: "Phone", amount: 30 },
    { id: 6, label: "Subscriptions", amount: 66 },
    { id: 7, label: "Car", amount: 400 },
  ],
  variable: [
    { id: 8, label: "Groceries", amount: 300 },
    { id: 9, label: "Gas", amount: 100 },
    { id: 10, label: "Eating Out", amount: 150 },
    { id: 11, label: "Fun Money", amount: 100 },
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

    // ---------- Goal helpers ----------
const handleAddGoal = () => {
  setGoals((prev) => [
    ...prev,
    {
      id: Date.now(),
      label: "New goal",
      code: `G${prev.length + 1}`,
      planPerMonth: 0,
      current: 0,
      target: 0, // you’ll set this on the Goals page
    },
  ]);
};

  const handleUpdateGoal = (id, changes) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...changes } : g))
    );
  };

  const handleDeleteGoal = (id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleContributeGoal = (id, amount) => {
    const amt = Number(amount);
    if (!amt || !Number.isFinite(amt) || amt <= 0) return;

    setGoals((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, current: (Number(g.current) || 0) + amt }
          : g
      )
    );
  };

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

// Same helper as in DashboardPage – turn a date string into "YYYY-MM"
function getMonthKeyFromDate(dateStr) {
  if (!dateStr) return null;

  // Already like "2025-12-11" or "2025-12"
  if (/^\d{4}-\d{2}/.test(dateStr)) {
    return dateStr.slice(0, 7); // "YYYY-MM"
  }

  // Formats like "12/11/2025" or "12-11-25"
  const m = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (m) {
    let [_, mm, dd, yy] = m;
    mm = mm.padStart(2, "0");
    let year = yy.length === 2 ? `20${yy}` : yy;
    return `${year}-${mm}`;
  }

  return null;
}

const filteredTransactions =
  selectedMonth === "all"
    ? transactions
    : transactions.filter(
        (t) => getMonthKeyFromDate(t.date) === selectedMonth
      );

// Totals for the selected month
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
  { id: "reports", label: "Reports" },
];


  /* ---------- Render ---------- */

  return (
    <div className={appClass}>
      {/* HEADER */}
      <header className={headerClass}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xs font-semibold tracking-[0.25em] text-red-400">
              BudgetR
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
    onContributeGoal={handleContributeGoal}
    transactions={transactions}
    onAddTransactions={(newItems) =>
      setTransactions((prev) => [...prev, ...newItems])
    }
    onDeleteTransaction={(id) =>
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    }
    onClearTransactions={() => setTransactions([])}
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
    onDeleteTransaction={(id) =>
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    }
    onClearTransactions={() => setTransactions([])}
  />
)}

{activeTab === "goals" && (
  <GoalsPage
    cardClass={cardClass}
    goals={goals}
    onAddGoal={handleAddGoal}
    onUpdateGoal={handleUpdateGoal}
    onDeleteGoal={handleDeleteGoal}
    onContributeGoal={handleContributeGoal}
  />
)}
{activeTab === "reports" && (
  <ReportsPage
    cardClass={cardClass}
    transactions={filteredTransactions}
  />
)}
      </main>
    </div>
  );
}


