import { useState } from "react";



export default function GoalCard({ goal, theme, onContribute, onDelete }) {
  const isDark = theme === "dark";
  const p = Math.min(
    100,
    goal.target > 0
      ? Math.round(((Number(goal.current) || 0) / goal.target) * 100)
      : 0
  );
  const [amount, setAmount] = useState("");

  const handleContributeClick = () => {
    if (!onContribute) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    onContribute(amt);
    setAmount("");
  };

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

        <div className="text-right text-sm text-gray-200">
          <p>
            ${Number(goal.current).toFixed(0)} / $
            {Number(goal.target).toFixed(0)}
          </p>
        </div>
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

      {onContribute && (
        <div className="flex items-center justify-between gap-2 text-xs mt-1">
          <div className="flex flex-1 items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="Amount"
              className="flex-1 rounded-full bg-black border border-gray-700 px-3 py-1.5 text-xs text-gray-100 outline-none focus:border-red-400"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button
              type="button"
              onClick={handleContributeClick}
              className="px-4 py-1.5 rounded-full border border-red-500 text-xs text-red-200 hover:bg-red-500 hover:text-black transition"
            >
              Contribute
            </button>
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-gray-500 hover:text-red-400"
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}