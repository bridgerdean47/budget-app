// src/components/HealthScoreCard.jsx
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function gradeFromSavingsRate(savingsRate) {
  const pct = (Number(savingsRate) || 0) * 100;

  // Requested grading:
  // - Good: 30–50% saved
  // - Excellent: 60–70% saved
  // (>= upper bounds still treated as the top grade)
  if (pct >= 60) return { label: "Excellent", color: "text-green-400" };
  if (pct >= 30) return { label: "Good", color: "text-green-300" };

  if (pct >= 15) return { label: "Fair", color: "text-yellow-300" };
  if (pct >= 5) return { label: "Needs Work", color: "text-orange-300" };
  return { label: "Critical", color: "text-red-400" };
}

/**
 * Score inputs:
 * - income, expenses, payments, leftover
 * - savingsGoal: { current, target }
 *
 * Scoring (0–100):
 * - Savings rate (leftover / income): 0–40 pts
 * - Expense ratio (expenses / income): 0–30 pts (lower is better)
 * - Debt/payment ratio (payments / income): 0–20 pts (lower is better)
 * - Emergency fund progress (savings current / target): 0–10 pts
 */
export default function HealthScoreCard({ cardClass, monthSummary, goals }) {
  const income = Number(monthSummary?.income) || 0;
  const expenses = Number(monthSummary?.expenses) || 0;
  const creditCard = Number(monthSummary?.creditCard) || 0;

  // Leftover should match the dashboard net: Income - Expenses - Credit Card
  const leftover = income - expenses - creditCard;

  const safeIncome = income > 0 ? income : 0;

  const savingsRate = safeIncome > 0 ? clamp(leftover / safeIncome, 0, 1) : 0; // 0..1
  const outflow = expenses + creditCard;
  const expenseRatio = safeIncome > 0 ? clamp(outflow / safeIncome, 0, 2) : 0; // can exceed 1

  const savingsGoal =
    (goals || []).find(
      (g) =>
        String(g.code || "").toUpperCase() === "SV" ||
        String(g.label || "").toLowerCase() === "savings"
    ) || null;

  const savingsCurrent = Number(savingsGoal?.current) || 0;
  const savingsTarget = Number(savingsGoal?.target) || 0;
  const emergencyProgress =
    savingsTarget > 0 ? clamp(savingsCurrent / savingsTarget, 0, 1) : 0.5; // neutral if no target set

  // Scoring
  const savingsPts = Math.round(55 * savingsRate);

  // expense score: full points at 50% or less, 0 points at 100%+
  const expensePts = Math.round(35 * clamp((1 - expenseRatio) / 0.5, 0, 1));


  const emergencyPts = Math.round(10 * emergencyProgress);

  const score = clamp(savingsPts + expensePts + emergencyPts, 0, 100);
  const meta = gradeFromSavingsRate(savingsRate);

  // Simple tips
  const tips = [];
  if (safeIncome === 0) {
    tips.push("Add income transactions to calculate a real score.");
  } else {
    if (savingsRate < 0.1) tips.push("Try to save at least 10% of your income.");
    if (expenseRatio > 0.8) tips.push("Expenses are high vs income—look for 1–2 cuts.");
    if (savingsTarget <= 0) tips.push("Set a Savings goal target (emergency fund) for a better score.");
  }

  const barPct = score;

  return (
    <section className={cardClass}>
      <h3 className="mb-4 text-xs font-semibold tracking-[0.28em] text-red-400">
        FINANCIAL HEALTH
      </h3>

      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-sm text-gray-400">Score</div>
          <div className="text-4xl font-bold text-gray-100">{score}</div>
          <div className={`text-sm font-semibold ${meta.color}`}>{meta.label}</div>
        </div>

        <div className="text-right text-xs text-gray-400 space-y-1">
          <div>Income: <span className="text-gray-200">{formatCurrency(income)}</span></div>
          <div>Expenses: <span className="text-gray-200">{formatCurrency(expenses)}</span></div>
          <div>Credit Card: <span className="text-gray-200">{formatCurrency(creditCard)}</span></div>
          <div>Leftover: <span className="text-gray-200">{formatCurrency(leftover)}</span></div>
        </div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black">
        <div
          className={
            "h-full transition-all duration-700 " +
            (score >= 70 ? "bg-green-400" : score >= 55 ? "bg-yellow-300" : "bg-red-500")
          }
          style={{ width: `${barPct}%` }}
        />
      </div>

      {tips.length > 0 && (
        <ul className="mt-4 space-y-1 text-xs text-gray-400 list-disc pl-5">
          {tips.slice(0, 3).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
