



function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export default function BudgetPage({ cardClass, monthSummary, budget, setBudget, budgetTotals }) {
  const monthLabel = budget.monthLabel || monthSummary.monthLabel;

  const { totalIncome, totalFixed, totalVariable, remainingForGoals } =
    budgetTotals || {
      totalIncome: 0,
      totalFixed: 0,
      totalVariable: 0,
      remainingForGoals: 0,
    };

  const plannedLeftAfterBills = totalIncome - totalFixed;
  const actualIncome = monthSummary.income;
  const actualSpending = monthSummary.expenses + monthSummary.payments;
  const estimatedSavings = totalIncome - totalFixed - actualSpending;

  const handleAddItem = (listKey) => {
    setBudget((prev) => {
      const nextId = Date.now();
      const nextList = [
        ...(prev[listKey] || []),
        { id: nextId, label: "New item", amount: 0 },
      ];
      return { ...prev, [listKey]: nextList };
    });
  };

  const handleUpdateItem = (listKey, id, field, value) => {
    setBudget((prev) => {
      const updated = (prev[listKey] || []).map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      );
      return { ...prev, [listKey]: updated };
    });
  };

  const handleDeleteItem = (listKey, id) => {
    setBudget((prev) => {
      const filtered = (prev[listKey] || []).filter((item) => item.id !== id);
      return { ...prev, [listKey]: filtered };
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
<h2 className="text-3xl font-bold text-gray-100">
  Spending Estimate
</h2>
<p className="text-sm text-gray-400">
  Plan your income and bills, then compare to real spending.
</p>

        </div>
      </header>

      {/* Summary card: planned vs actual */}
      <section className={cardClass}>
        <h3 className="text-xs font-semibold tracking-[0.28em] text-red-400 mb-4">
          ESTIMATE SUMMARY
        </h3>

        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="space-y-1">
            <p className="text-[0.7rem] tracking-[0.16em] text-gray-400 uppercase">
              Planned Income
            </p>
            <p className="text-lg font-semibold text-green-400">
              {formatCurrency(totalIncome)}
            </p>
            <p className="text-[0.7rem] text-gray-500">
              From your income list below.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[0.7rem] tracking-[0.16em] text-gray-400 uppercase">
              Bills (Fixed + Variable)
            </p>
            <p className="text-lg font-semibold text-red-400">
              {formatCurrency(totalFixed + totalVariable)}
            </p>
            <p className="text-[0.7rem] text-gray-500">
              What you expect to spend this month.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[0.7rem] tracking-[0.16em] text-gray-400 uppercase">
              Planned Left After Bills
            </p>
            <p className="text-lg font-semibold text-white">
              {formatCurrency(plannedLeftAfterBills)}
            </p>
            <p className="text-[0.7rem] text-gray-500">
              Income minus fixed bills only.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3 text-sm">
          <div className="space-y-1">
            <p className="text-[0.7rem] tracking-[0.16em] text-gray-400 uppercase">
              Actual Income (Selected Month)
            </p>
            <p className="text-lg font-semibold text-green-400">
              {formatCurrency(actualIncome)}
            </p>
            <p className="text-[0.7rem] text-gray-500">
              From imported transactions.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[0.7rem] tracking-[0.16em] text-gray-400 uppercase">
              Actual Spending + Payments
            </p>
            <p className="text-lg font-semibold text-red-400">
              {formatCurrency(actualSpending)}
            </p>
            <p className="text-[0.7rem] text-gray-500">
              Expenses plus payments this month.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[0.7rem] tracking-[0.16em] text-gray-400 uppercase">
              Estimated Savings
            </p>
            <p className="text-lg font-semibold text-emerald-400">
              {formatCurrency(estimatedSavings)}
            </p>
            <p className="text-[0.7rem] text-gray-500">
              Planned income − bills − actual spending.
            </p>
          </div>
        </div>
      </section>

      {/* Editable budget lists */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Income */}
        <section className={cardClass}>
          <h3 className="text-xs font-semibold tracking-[0.28em] text-gray-400 mb-4">
            INCOME
          </h3>

          <div className="space-y-2 text-sm">
            {(budget.income || []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 text-gray-100"
              >
                <input
                  className="bg-transparent border-b border-transparent focus:border-gray-600 outline-none text-sm flex-1"
                  value={item.label}
                  onChange={(e) =>
                    handleUpdateItem("income", item.id, "label", e.target.value)
                  }
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="bg-transparent border-b border-transparent focus:border-gray-600 outline-none text-right w-24 text-sm"
                    value={item.amount}
                    onChange={(e) =>
                      handleUpdateItem(
                        "income",
                        item.id,
                        "amount",
                        Number(e.target.value) || 0
                      )
                    }
                  />
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-red-400"
                    onClick={() => handleDeleteItem("income", item.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-400 uppercase tracking-[0.16em]">
              TOTAL
            </span>
            <span className="text-green-400 font-semibold">
              {formatCurrency(totalIncome)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleAddItem("income")}
            className="mt-4 inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-green-500 text-xs text-green-300 
                       hover:bg-green-500 hover:text-black transition"
          >
            + Add Income Item
          </button>
        </section>

        {/* Fixed expenses */}
        <section className={cardClass}>
          <h3 className="text-xs font-semibold tracking-[0.28em] text-gray-400 mb-4">
            FIXED EXPENSES
          </h3>

          <div className="space-y-2 text-sm">
            {(budget.fixed || []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 text-gray-100"
              >
                <input
                  className="bg-transparent border-b border-transparent focus:border-gray-600 outline-none text-sm flex-1"
                  value={item.label}
                  onChange={(e) =>
                    handleUpdateItem("fixed", item.id, "label", e.target.value)
                  }
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="bg-transparent border-b border-transparent focus:border-gray-600 outline-none text-right w-24 text-sm"
                    value={item.amount}
                    onChange={(e) =>
                      handleUpdateItem(
                        "fixed",
                        item.id,
                        "amount",
                        Number(e.target.value) || 0
                      )
                    }
                  />
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-red-400"
                    onClick={() => handleDeleteItem("fixed", item.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-400 uppercase tracking-[0.16em]">
              TOTAL
            </span>
            <span className="text-red-500 font-semibold">
              {formatCurrency(totalFixed)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleAddItem("fixed")}
            className="mt-4 inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-red-500 text-xs text-red-300 
                       hover:bg-red-500 hover:text-black transition"
          >
            + Add Fixed Expense
          </button>
        </section>

        {/* Variable spending */}
        <section className={cardClass}>
          <h3 className="text-xs font-semibold tracking-[0.28em] text-gray-400 mb-4">
            VARIABLE SPENDING
          </h3>

          <div className="space-y-2 text-sm">
            {(budget.variable || []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 text-gray-100"
              >
                <input
                  className="bg-transparent border-b border-transparent focus:border-gray-600 outline-none text-sm flex-1"
                  value={item.label}
                  onChange={(e) =>
                    handleUpdateItem(
                      "variable",
                      item.id,
                      "label",
                      e.target.value
                    )
                  }
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="bg-transparent border-b border-transparent focus:border-gray-600 outline-none text-right w-24 text-sm"
                    value={item.amount}
                    onChange={(e) =>
                      handleUpdateItem(
                        "variable",
                        item.id,
                        "amount",
                        Number(e.target.value) || 0
                      )
                    }
                  />
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-red-400"
                    onClick={() => handleDeleteItem("variable", item.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-400 uppercase tracking-[0.16em]">
              TOTAL
            </span>
            <span className="text-yellow-400 font-semibold">
              {formatCurrency(totalVariable)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleAddItem("variable")}
            className="mt-4 inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-yellow-400 text-xs text-yellow-300 
                       hover:bg-yellow-400 hover:text-black transition"
          >
            + Add Variable Expense
          </button>
        </section>

        {/* Remaining for goals */}
        <section className={cardClass}>
          <h3 className="text-xs font-semibold tracking-[0.28em] text-gray-400 mb-4">
            REMAINING FOR GOALS (BASED ON PLAN)
          </h3>

          <p className="text-3xl font-bold text-white mb-2">
            {formatCurrency(remainingForGoals)}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            This is what&apos;s left after planned income minus all planned
            expenses. Use it for savings, debt, or your Japan trip.
          </p>

          <p className="text-xs text-gray-500">
            Your actual month leftover (using real transactions) is{" "}
            <span className="text-emerald-400 font-semibold">
              {formatCurrency(monthSummary.leftover)}
            </span>
            .
          </p>
        </section>
      </div>
    </div>
  );
}