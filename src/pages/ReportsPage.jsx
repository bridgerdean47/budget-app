import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;

  const { name, value, payload: row } = payload[0];

  return (
    <div className="rounded-md border border-red-500 bg-black/90 px-3 py-2 text-xs text-gray-100 shadow-lg">
      <div className="font-semibold">{name}</div>
      <div>
        {formatCurrency(value)}{" "}
        {row && typeof row.pct === "number"
          ? `(${row.pct.toFixed(1)}%)`
          : null}
      </div>
    </div>
  );
}

export default function ReportsPage({ cardClass, transactions, compact = false }) {
  // Use expenses + credit card charges for "where money is going"
  // (credit_card represents card purchases; transfers like payments are excluded)
  const expenseTx = (transactions || []).filter(
    (t) => t.type === "expense" || t.type === "credit_card"
  );

  // Totals per category
  const totalsByCategory = new Map();
  for (const tx of expenseTx) {
    const cat = tx.category || "Uncategorized";
    const current = totalsByCategory.get(cat) || 0;
    totalsByCategory.set(cat, current + (Number(tx.amount) || 0));
  }

  const totalSpent = Array.from(totalsByCategory.values()).reduce(
    (sum, v) => sum + v,
    0
  );

  // Base data, sorted largest → smallest
  const baseData = Array.from(totalsByCategory.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Limit legend to top N categories + "Other"
  const MAX_LEGEND_ITEMS = 12;
  let displayData = baseData;

  if (baseData.length > MAX_LEGEND_ITEMS) {
    const top = baseData.slice(0, MAX_LEGEND_ITEMS - 1);
    const rest = baseData.slice(MAX_LEGEND_ITEMS - 1);
    const otherTotal = rest.reduce((s, r) => s + r.value, 0);
    displayData = [...top, { name: "Other", value: otherTotal }];
  }

  // Attach percentages
  const data = displayData.map((row) => ({
    ...row,
    pct: totalSpent > 0 ? (row.value / totalSpent) * 100 : 0,
  }));

  const COLORS = [
    "#22c55e",
    "#ef4444",
    "#eab308",
    "#6366f1",
    "#06b6d4",
    "#8b5cf6",
    "#f97316",
    "#10b981",
    "#ec4899",
    "#facc15",
    "#14b8a6",
    "#64748b",
  ];

  return (
    <div className="space-y-8">
{/* HEADER */}
{!compact && (
  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
    <div>
      <h2 className="text-3xl font-bold text-gray-100">
        Spending Reports
      </h2>
      <p className="text-sm text-gray-400">
        See where your money is going by category.
      </p>
    </div>
  </div>
)}

      {/* MAIN CARD */}
      <section className={cardClass}>
        <h3 className="mb-4 text-xs font-semibold tracking-[0.28em] text-red-400">
          SPENDING BY CATEGORY
        </h3>

        {data.length === 0 ? (
          <p className="text-sm text-gray-400">
            No expenses yet for this period. Add some transactions to
            see a breakdown.
          </p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            {/* Donut chart */}
            <div className="relative h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="60%"
                    outerRadius="90%"
                    paddingAngle={2}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    content={<CustomTooltip />}
                    wrapperStyle={{ pointerEvents: "none" }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center total INSIDE the donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-sm text-gray-400">Total spent</div>
                <div className="text-2xl font-semibold text-gray-100">
                  {formatCurrency(totalSpent)}
                </div>
              </div>
            </div>

            {/* Category list (two columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {data.map((row, i) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="inline-block h-3 w-3 rounded-full shrink-0"
                      style={{
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                    <span className="text-gray-200 truncate">
                      {row.name}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-gray-100">
                      {formatCurrency(row.value)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {row.pct.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
