
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
            <option value="all">All months</option>
            <option value="2025-11">Nov 2025</option>
            <option value="2025-12">Dec 2025</option>
          </select>
        </div>
      </div>

      {/* MONTH OVERVIEW + CASH FLOW */}
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