
import { useState } from "react";



export default function GoalsPage({
  cardClass,
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onContributeGoal,
}) {
  const [amounts, setAmounts] = useState({});

  const handleChangeAmount = (id, value) => {
    setAmounts((prev) => ({ ...prev, [id]: value }));
  };

  const handleContribute = (id) => {
    const raw = amounts[id];
    const amt = parseFloat(raw);
    if (!amt || amt <= 0) return;
    onContributeGoal(id, amt);
    setAmounts((prev) => ({ ...prev, [id]: "" }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-100">Goals</h2>
        <button
          type="button"
          onClick={onAddGoal}
          className="px-4 py-1.5 rounded-full border border-red-500 text-xs text-red-200 hover:bg-red-500 hover:text-black transition"
        >
          + Add Goal
        </button>
      </div>

      <p className="text-gray-400 text-sm">
        Edit your goals, contribute to them, or delete ones you no longer need.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((goal) => {
          const pct = Math.min(
            100,
            goal.target > 0
              ? Math.round(((Number(goal.current) || 0) / goal.target) * 100)
              : 0
          );

          return (
<section key={goal.id} className={cardClass}>
  <div className="flex items-start justify-between mb-3">
    <div className="flex-1 space-y-1">
      <input
        className="bg-transparent text-sm font-semibold text-gray-100 border-b border-transparent focus:border-gray-600 outline-none w-full"
        value={goal.label}
        onChange={(e) =>
          onUpdateGoal(goal.id, { label: e.target.value })
        }
      />
      <div className="flex gap-2 text-[0.7rem] text-gray-400">
        <input
          className="bg-transparent border-b border-transparent focus:border-gray-600 outline-none w-14"
          value={goal.code}
          onChange={(e) =>
            onUpdateGoal(goal.id, { code: e.target.value })
          }
        />
        <span>Plan:</span>
        <input
          type="number"
          className="bg-transparent border-b border-transparent focus:border-gray-600 outline-none w-20"
          value={goal.planPerMonth}
          onChange={(e) =>
            onUpdateGoal(goal.id, {
              planPerMonth: Number(e.target.value) || 0,
            })
          }
        />
        <span>/mo</span>
      </div>

      {/* NEW: Target row */}
      <div className="flex gap-2 text-[0.7rem] text-gray-400 mt-1">
        <span>Target:</span>
        <input
          type="number"
          className="bg-transparent border-b border-transparent focus:border-gray-600 outline-none w-24"
          value={goal.target}
          onChange={(e) =>
            onUpdateGoal(goal.id, {
              target: Number(e.target.value) || 0,
            })
          }
        />
      </div>
    </div>

    <button
      type="button"
      onClick={() => onDeleteGoal(goal.id)}
      className="text-xs text-gray-500 hover:text-red-400 ml-3"
    >
      ×
    </button>
  </div>
  ...

              <div className="mb-2 text-sm text-gray-200 text-right">
                ${Number(goal.current).toFixed(2)} / $
                {Number(goal.target).toFixed(2)}
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-black mb-3">
                <div
                  className={
                    "h-full transition-all duration-700 " +
                    (pct >= 80 ? "bg-green-400" : "bg-red-500")
                  }
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
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