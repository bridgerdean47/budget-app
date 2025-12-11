

export default function CashFlowBar({ theme, income, expenses }) {
  const total = income + expenses;
  if (total <= 0) return null;

  const incomePct = (income / total) * 100;
  const net = income - expenses;

  // one smooth gradient: green part = income, red part = expenses
  const gradient = `linear-gradient(
    90deg,
    rgba(16,240,120,1) 0%,
    rgba(16,240,120,1) ${incomePct}%,
    rgba(255,30,60,1) ${incomePct}%,
    rgba(255,30,60,1) 100%
  )`;

  return (
    <div className="mt-4 space-y-2">
      {/* BAR */}
      <div className="h-3 w-full rounded-full overflow-hidden bg-[#050505] border border-red-900">
        <div className="h-full w-full" style={{ background: gradient }} />
      </div>

      {/* LABELS UNDER BAR */}
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-emerald-400">
          Income:{" "}
          {income.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
        </span>

        <span className="text-gray-300">
          Net:{" "}
          {net.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
        </span>

        <span className="text-red-400">
          Expenses:{" "}
          {expenses.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
        </span>
      </div>
    </div>
  );
}
