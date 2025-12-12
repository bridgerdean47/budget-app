import { useState, useEffect, useRef } from "react";
import DashboardPage from "./pages/DashboardPage.jsx";
import BudgetPage from "./pages/BudgetPage.jsx";
import TransactionsPage from "./pages/TransactionsPage.jsx";
import GoalsPage from "./pages/GoalsPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import logo from "./assets/logo.png";
import LoginPage from "./pages/LoginPage.jsx";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const blankGoals = [];
const blankBudget = {
  monthLabel: "",
  income: [],
  fixed: [],
  variable: [],
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

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState("dark");
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); // NEW: track if cloud data loaded
  const [goals, setGoals] = useState(blankGoals);
  const [budget, setBudget] = useState(blankBudget);
  
  // NEW: Debounce timer to prevent rapid Firebase writes
  const saveTimerRef = useRef(null);
  const initialLoadRef = useRef(false);

  const budgetTotals = getBudgetTotals(budget);
  const isDark = theme === "dark";

  // Goal helpers
  const handleAddGoal = () => {
    setGoals((prev) => [
      ...prev,
      {
        id: Date.now(),
        label: "New goal",
        code: `G${prev.length + 1}`,
        planPerMonth: 0,
        current: 0,
        target: 0,
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

  // Load from cloud when user logs in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthReady(true);

      if (!u) {
        // User logged out - reset to blank state
        setTransactions([]);
        setBudget(blankBudget);
        setGoals(blankGoals);
        setSelectedMonth("all");
        setDataLoaded(false);
        initialLoadRef.current = false;
        return;
      }

      // User logged in - load their data
      try {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
          setBudget(data.budget || blankBudget);
          setGoals(Array.isArray(data.goals) ? data.goals : blankGoals);
          setSelectedMonth(data.selectedMonth || "all");
        } else {
          // New user - create blank document
          await setDoc(ref, {
            transactions: [],
            budget: blankBudget,
            goals: blankGoals,
            selectedMonth: "all",
            updatedAt: Date.now(),
          });

          setTransactions([]);
          setBudget(blankBudget);
          setGoals(blankGoals);
          setSelectedMonth("all");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setDataLoaded(true);
        initialLoadRef.current = true;
      }
    });

    return () => unsub();
  }, []);

  // Save to cloud with debouncing (prevents rapid writes)
  useEffect(() => {
    // Don't save during initial load
    if (!user || !initialLoadRef.current) return;

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Debounce: wait 500ms after last change before saving
    saveTimerRef.current = setTimeout(async () => {
      try {
        const ref = doc(db, "users", user.uid);
        await setDoc(
          ref,
          {
            transactions,
            budget,
            goals,
            selectedMonth,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
        console.log("✅ Saved to cloud");
      } catch (error) {
        console.error("Error saving to cloud:", error);
      }
    }, 500);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [user, transactions, budget, goals, selectedMonth]);

  /* ---------- Month filtering + summary ---------- */
  function getMonthKeyFromDate(dateStr) {
    if (!dateStr) return null;
    if (/^\d{4}-\d{2}/.test(dateStr)) {
      return dateStr.slice(0, 7);
    }
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

  const leftover = income - expenses - payments;

  function formatMonthLabel(key) {
    if (key === "all") return "All Months";
    const [year, month] = key.split("-");
    const names = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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

  /* ---------- Styles ---------- */
  const appClass = "min-h-screen bg-[#050505] text-gray-100";
  const headerClass =
    "border-b sticky top-0 z-50 backdrop-blur bg-[#050505cc] border-red-900 h-16";
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

  // Show loading screen while checking auth
  if (!authReady) {
    return (
      <div className={appClass}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return (
      <div className={appClass}>
        <header className={headerClass}>
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center">
              <img src={logo} alt="BudgetR" className="h-9 w-auto" />
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-10">
          <LoginPage cardClass={cardClass} />
        </main>
      </div>
    );
  }

  // Show loading screen while fetching user data
  if (!dataLoaded) {
    return (
      <div className={appClass}>
        <header className={headerClass}>
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="BudgetR logo" className="h-9 w-auto" />
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your data...</p>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Render ---------- */
  return (
    <div className={appClass}>
      {/* HEADER */}
      <header className={headerClass}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="BudgetR logo" className="h-9 w-auto" />
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
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => signOut(auth)}
                className={navInactive}
              >
                Log out
              </button>
            </div>
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