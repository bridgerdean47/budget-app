// src/pages/DashboardPage.jsx
import { useMemo } from "react";
import CashFlowBar from "../components/CashFlowBar.jsx";
import GoalCard from "../components/GoalCard.jsx";
import OverviewStat from "../components/OverviewStat.jsx";
import ReportsPage from "./ReportsPage.jsx";
import HealthScoreCard from "../components/HealthScoreCard.jsx";

// Turn a date string into a "YYYY-MM" key
function getMonthKeyFromDate(dateStr) {
  if (!dateStr) return null;

  // Case 1: already like "2025-12-11" or "2025-12"
  if (/^\d{4}-\d{2}/.test(dateStr)) {
    return dateStr.slice(0, 7); // "YYYY-MM"
  }

  // Case 2: formats like "12/11/2025" or "12-11-25"
  const m = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (m) {
    let [_, mm, dd, yy] = m;
    mm = mm.padStart(2, "0");
    let year = yy.length === 2 ? `20${yy}` : yy;
    return `${year}-${mm}`;
  }

  return null;
}

function formatMonthLabel(key) {
  if (key === "all") return "All months";
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

export default function DashboardPage({
  theme,
  cardClass,
  monthSummary,
  healthSummary,
  selectedMonth,
  onMonthChange,
  budgetTotals,
  goals,
  onContributeGoal,
  transactions,
  reportTransactions,
}) {
  // Build dropdown options from transaction dates
  const monthOptions = useMemo(() => {
    const set = new Set(
      (transactions || [])
        .map((t) => getMonthKeyFromDate(t.date))
        .filter(Boolean)
    );
    const keys = Array.from(set).sort();
    return ["all", ...keys];
  }, [transactions]);

  // Credit Card total is now driven by Chase-imported rows (source === "chase")
  // because Chase charges/payments are treated as transfers.
  const creditCardTotal = useMemo(() => {
    const monthKey = selectedMonth;

    const inSelectedMonth = (t) => {
      if (monthKey === "all") return true;
      return getMonthKeyFromDate(t.date) === monthKey;
    };

    return (transactions || [])
      .filter((t) => inSelectedMonth(t))
      .filter((t) => {
        const src = String(t?.source || "").toLowerCase();

        // Primary: new Chase rows — ONLY count actual charges
        if (src === "chase") return t.type === "credit_card";

        // Back-compat: older saved data
        if (t.type === "credit_card") return true;
        if ((t.category || "") === "Credit Card") return true;

        return false;
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions, selectedMonth]);

  // Use the computed credit card total so the dashboard matches the new transaction model.
  const displayMonthSummary = useMemo(
    () => ({ ...monthSummary, creditCard: creditCardTotal }),
    [monthSummary, creditCardTotal]
  );

  return (
    <div className="space-y-8">
      {/* HEADER ROW */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-100">
            {displayMonthSummary.monthLabel}
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
            {monthOptions.map((key) => (
              <option key={key} value={key}>
                {formatMonthLabel(key)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MONTH OVERVIEW + CASH FLOW */}
      <section className={cardClass}>
        <h3 className="mb-4 text-xs font-semibold tracking-[0.28em] text-red-400">
          MONTH OVERVIEW
        </h3>

        {/* 3 columns: Income, Expenses, Credit Card */}
        <div className="grid gap-6 md:grid-cols-3">
          <OverviewStat
            label="INCOME"
            value={displayMonthSummary.income}
            color="text-green-400"
          />
          <OverviewStat
            label="EXPENSES"
            value={displayMonthSummary.expenses}
            color="text-red-500"
          />
          <OverviewStat
            label="CREDIT CARD"
            value={displayMonthSummary.creditCard}
            color="text-yellow-400"
          />
        </div>

        <div className="mt-6">
          <CashFlowBar
            theme={theme}
            income={displayMonthSummary.income}
            expenses={displayMonthSummary.expenses}
            creditCard={displayMonthSummary.creditCard}
          />
        </div>
      </section>

      {/* GOALS (CONTRIBUTE ONLY) */}
      <section>
        <h3 className="mb-4 text-xs font-semibold tracking-[0.28em] text-red-400">
          GOALS
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          {(goals || []).map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              theme={theme}
              onContribute={(amount) => onContributeGoal(goal.id, amount)}
            />
          ))}
        </div>
      </section>

      {/* FINANCIAL HEALTH */}
      <HealthScoreCard
        cardClass={cardClass}
        monthSummary={displayMonthSummary}
        goals={goals}
      />

      {/* REPORTS WIDGET */}
      <section>
        <h3 className="mb-4 text-xs font-semibold tracking-[0.28em] text-red-400">
          REPORTS
        </h3>

        <ReportsPage
          cardClass={cardClass}
          transactions={reportTransactions || []}
          compact
        />
      </section>
    </div>
  );
}