import { useMemo } from "react";
import CashFlowBar from "../components/CashFlowBar.jsx";
import GoalCard from "../components/GoalCard.jsx";
import OverviewStat from "../components/OverviewStat.jsx";
import MiniTransactionsWidget from "../components/MiniTransactionsWidget.jsx";

function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

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
  selectedMonth,
  onMonthChange,
  budgetTotals,
  goals,
  onContributeGoal,
  transactions,
  onAddTransactions,
  onDeleteTransaction,
  onClearTransactions,
}) {
  // Build dropdown options from transaction dates
  const monthOptions = useMemo(() => {
    const set = new Set(
      (transactions || [])
        .map((t) => getMonthKeyFromDate(t.date))
        .filter(Boolean)
    );
    const keys = Array.from(set).sort(); // "2025-01", "2025-02", ...
    return ["all", ...keys];
  }, [transactions]);

  return (
    <div className="space-y-8">
      {/* HEADER ROW */}
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

        {/* 3 columns: Income, Expenses, Payments */}
        <div className="grid gap-6 md:grid-cols-3">
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
        </div>

        <div className="mt-6">
          <CashFlowBar
            theme={theme}
            income={monthSummary.income}
            expenses={monthSummary.expenses}
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
              // no onDelete here → cannot delete from dashboard
            />
          ))}
        </div>
      </section>

      {/* MINI TRANSACTIONS WIDGET */}
      <MiniTransactionsWidget
        cardClass={cardClass}
        transactions={transactions}
        onAddTransactions={onAddTransactions}
        onDeleteTransaction={onDeleteTransaction}
        onClearTransactions={onClearTransactions}
      />
    </div>
  );
}