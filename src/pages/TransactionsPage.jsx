// src/pages/TransactionsPage.jsx
import { useState, useMemo, useRef } from "react";
import { parseCsv } from "../lib/csv";

/* -------------------------------------------------
   CATEGORY OPTIONS
-------------------------------------------------- */
const CATEGORY_OPTIONS = [
  "Uncategorized",
  "Rent",
  "Credit Card Payments",
  "Loans",
  "Insurance",
  "Groceries",
  "Food & Drink",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Gas",
  "Automotive",
  "Health & Wellness",
  "Pets",
  "Travel",
  "Personal",
  "Cable/Satellite Services",
  "To Checking",
  "To Savings",
];

/* -------------------------------------------------
   MERCHANT CATEGORY OVERRIDES
-------------------------------------------------- */
const MERCHANT_CATEGORY_RULES = [
  { match: "apts anderson", category: "Rent" },
  { match: "apts ander", category: "Rent" },
  { match: "ach apts", category: "Rent" },
  { match: "withdrawal ach apts", category: "Rent" },
  { match: "quantum fiber", category: "Bills & Utilities" }, // internet
  { match: "dept education", category: "Loans" }, // student loans
  { match: "chase credit crd", category: "Credit Card Payments" },
];

/* -------------------------------------------------
   CATEGORY GUESSER
-------------------------------------------------- */
function guessCategory(desc = "") {
  const d = desc.toLowerCase();

  // Strong rent overrides first
  if (
    d.includes("apts anderson") ||
    d.includes("apts ander") ||
    d.includes(" apts ") ||
    d.startsWith("apts ") ||
    d.includes("apartment") ||
    d.includes(" rent") ||
    d.startsWith("rent") ||
    d.includes("lease")
  ) {
    return "Rent";
  }

  // Merchant rules
  for (const rule of MERCHANT_CATEGORY_RULES) {
    if (d.includes(rule.match)) return rule.category;
  }

  // Groceries
  if (d.includes("walmart") || d.includes("grocery") || d.includes("winco"))
    return "Groceries";

  // Restaurants / fast food
  if (
    d.includes("mcdonald") ||
    d.includes("taco bell") ||
    d.includes("burger king") ||
    d.includes("wendy") ||
    d.includes("subway") ||
    d.includes("restaurant") ||
    d.includes("cafe")
  )
    return "Food & Drink";

  // Gas
  if (d.includes("shell") || d.includes("chevron") || d.includes("gas "))
    return "Gas";

  // Utilities
  if (
    d.includes("power") ||
    d.includes("electric") ||
    d.includes("water") ||
    d.includes("gas & electric")
  )
    return "Bills & Utilities";

  // Subscriptions / streaming
  if (
    d.includes("spotify") ||
    d.includes("netflix") ||
    d.includes("hulu") ||
    d.includes("youtube")
  )
    return "Entertainment";

  // Loans / debt
  if (d.includes("loan")) return "Loans";

  // Travel
  if (d.includes("flight") || d.includes("hotel") || d.includes("airbnb"))
    return "Travel";

  // Pets
  if (d.includes("pet") || d.includes("vet")) return "Pets";

  // Safe Insurance detection
  if (d.includes("insurance") || /\binsurance\b/.test(d)) return "Insurance";

  // Shopping
  if (d.includes("amazon") || d.includes("target")) return "Shopping";

  return null;
}

/* -------------------------------------------------
   DATE HELPERS
-------------------------------------------------- */
function getMonthKeyFromDate(dateStr) {
  if (!dateStr) return null;

  if (/^\d{4}-\d{2}/.test(dateStr)) return dateStr.slice(0, 7);

  const m = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (m) {
    let [_, mm, dd, yy] = m;
    mm = mm.padStart(2, "0");
    const year = yy.length === 2 ? `20${yy}` : yy;
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

/* -------------------------------------------------
   COMPONENT
-------------------------------------------------- */
export default function TransactionsPage({
  theme,
  cardClass,
  transactions,
  imports,
  onDeleteImportBatch,
  onAddTransactions,
  onUpdateTransaction,
  onDeleteTransaction,
  onClearTransactions,
}) {
  const [editing, setEditing] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const fileInputRef = useRef(null);

  /* -----------------------------------------------
     CSV IMPORT (MULTI-FILE) + BATCH META
  -------------------------------------------------- */
  const readFileText = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });

  const handleFilesSelected = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const bad = files.find((f) => !f.name.toLowerCase().endsWith(".csv"));
    if (bad) {
      setImportMessage("Please choose only .csv files.");
      return;
    }

    setImportMessage(`Reading ${files.length} file(s)...`);

    const allParsed = [];

    for (const file of files) {
      const text = await readFileText(file);
      const parsedRaw = parseCsv(text, transactions.length + allParsed.length);

      const parsed = parsedRaw.map((tx) => {
        const desc = (tx.description || "").toLowerCase();

        // ----- TYPE FIX -----
        let type = tx.type || "expense";

        if (type === "expense") {
          if (
            desc.includes(" epay") ||
            desc.includes("type: epay") ||
            desc.includes("withdrawal ach chase credit crd")
          ) {
            type = "transfer";
          } else if (desc.includes("payment thank you")) {
            type = "payment";
          }
        }

        // ----- CATEGORY LOGIC -----
        let category = tx.category || "";
        const guessed = guessCategory(tx.description);

        if (guessed === "Rent") {
          category = "Rent";
        } else if (!category || category.toLowerCase() === "uncategorized") {
          category = guessed || "Uncategorized";
        }

        return {
          ...tx,
          type,
          category,
        };
      });

      allParsed.push(...parsed);
    }

    if (!allParsed.length) {
      setImportMessage("No valid rows found in selected CSV files.");
    } else {
      const batchId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const batchMeta = {
        id: batchId,
        importedAt: Date.now(),
        count: allParsed.length,
        files: files.map((f) => ({
          name: f.name,
          size: f.size,
          lastModified: f.lastModified,
        })),
      };

      onAddTransactions(allParsed, batchMeta);
      setImportMessage(
        `Imported ${allParsed.length} transactions from ${files.length} file(s).`
      );
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* -----------------------------------------------
     DRAG/DROP
  -------------------------------------------------- */
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  /* -----------------------------------------------
     SORTING + FILTERS
  -------------------------------------------------- */
  const handleSortClick = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const monthOptions = useMemo(() => {
    const set = new Set(
      (transactions || [])
        .map((t) => getMonthKeyFromDate(t.date))
        .filter(Boolean)
    );
    const keys = Array.from(set).sort();
    return ["all", ...keys];
  }, [transactions]);

  const sortedTransactions = useMemo(() => {
    let data = [...(transactions || [])];

    // SORT
    if (sortConfig.key === "date") {
      data.sort((a, b) => {
        const da = new Date(a.date || 0);
        const db = new Date(b.date || 0);
        return sortConfig.direction === "asc" ? da - db : db - da;
      });
    } else if (sortConfig.key === "type") {
      const order = { income: 0, expense: 1, payment: 2, transfer: 3 };
      data.sort((a, b) => {
        const aRank = order[a.type] ?? 99;
        const bRank = order[b.type] ?? 99;
        return sortConfig.direction === "asc" ? aRank - bRank : bRank - aRank;
      });
    }

    // FILTER (month)
    if (selectedMonth !== "all") {
      data = data.filter((t) => getMonthKeyFromDate(t.date) === selectedMonth);
    }

    // FILTER (category)
    if (categoryFilter !== "all") {
      data = data.filter(
        (t) => (t.category || "Uncategorized") === categoryFilter
      );
    }

    return data;
  }, [transactions, sortConfig, categoryFilter, selectedMonth]);

  const renderSortIcon = (key) =>
    sortConfig.key !== key ? (
      <span className="text-[0.6rem] text-gray-500">⇅</span>
    ) : (
      <span className="text-[0.6rem] text-gray-300">
        {sortConfig.direction === "asc" ? "▲" : "▼"}
      </span>
    );

  /* -----------------------------------------------
     RENDER
  -------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="space-y-2 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-100">Transactions</h2>
          <p className="text-gray-400 text-sm">
            Upload a bank CSV or click a row to edit it.
          </p>
        </div>
        <button
          type="button"
          onClick={onClearTransactions}
          className="text-xs px-4 py-1.5 rounded-full border border-gray-600 text-gray-300 hover:border-red-500 hover:text-red-300"
        >
          Clear All
        </button>
      </div>

      {/* Imported CSV history */}
      {Array.isArray(imports) && imports.length > 0 && (
        <section className={cardClass}>
          <h3 className="mb-3 text-xs font-semibold tracking-[0.28em] text-red-400">
            IMPORT HISTORY
          </h3>

          <div className="space-y-2 text-sm">
            {imports.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-700 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-gray-200 truncate">
                    {(b.files || []).map((f) => f.name).join(", ")}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(b.importedAt).toLocaleString()} • {b.count}{" "}
                    transactions
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteImportBatch(b.id)}
                  className="shrink-0 text-xs px-3 py-1 rounded-full border border-gray-600 text-gray-300 hover:border-red-500 hover:text-red-300"
                >
                  Delete import
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* IMPORT CARD */}
      <section className={cardClass}>
        <h3 className="text-xs font-semibold tracking-[0.28em] text-red-400">
          BANK STATEMENT IMPORT (CSV)
        </h3>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={
            "mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-6 cursor-pointer transition " +
            (isDragging
              ? "border-red-400 bg-red-500/10"
              : "border-red-700 bg-black/40 hover:border-red-500 hover:bg-red-500/5")
          }
        >
          <p className="text-gray-200 font-medium mb-1">
            Drag & drop CSV file(s) here
          </p>
          <p className="text-gray-400">
            or <span className="text-red-300 underline">click to browse</span>
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
        </div>

        {importMessage && (
          <p className="text-[0.7rem] text-gray-400 mt-2">{importMessage}</p>
        )}
      </section>

      {/* TABLE CARD */}
      <section className={cardClass}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          {/* Month filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-[#050505] border border-gray-700 text-xs rounded px-2 py-1 text-gray-200"
            >
              {monthOptions.map((key) => (
                <option key={key} value={key}>
                  {formatMonthLabel(key)}
                </option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#050505] border border-gray-700 text-xs rounded px-2 py-1 text-gray-200"
            >
              <option value="all">All</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Clear */}
          {(categoryFilter !== "all" || selectedMonth !== "all") && (
            <button
              type="button"
              onClick={() => {
                setCategoryFilter("all");
                setSelectedMonth("all");
              }}
              className="text-xs text-gray-400 hover:text-gray-200 underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-red-900/60">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#111111] text-gray-200 border-b border-red-900">
                <th className="px-4 py-3 text-left font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSortClick("date")}
                    className="flex items-center gap-1 select-none"
                  >
                    <span>Date</span>
                    {renderSortIcon("date")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Description
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSortClick("type")}
                    className="flex items-center gap-1 select-none"
                  >
                    <span>Type</span>
                    {renderSortIcon("type")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-left font-semibold">Amount</th>
                <th className="px-4 py-3 text-center font-semibold">Del</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((t, i) => (
                <tr
                  key={`${t.id}-${i}`}
                  onClick={() => setEditing(t)}
                  className="cursor-pointer border-b border-gray-800 transition-colors transform hover:bg-[#111111] hover:translate-x-1"
                >
                  <td className="px-4 py-2 text-gray-200">{t.date}</td>
                  <td className="px-4 py-2 text-gray-100">{t.description}</td>

                  <td
                    className={
                      "px-4 py-2 " +
                      (t.type === "income"
                        ? "text-green-400"
                        : t.type === "payment"
                        ? "text-yellow-400"
                        : t.type === "transfer"
                        ? "text-blue-400"
                        : "text-red-500")
                    }
                  >
                    {t.type === "income"
                      ? "Income"
                      : t.type === "payment"
                      ? "Payment"
                      : t.type === "transfer"
                      ? "Transfer"
                      : "Expense"}
                  </td>

                  {/* Category dropdown */}
                  <td className="px-4 py-2 text-gray-100">
                    <select
                      className="bg-[#050505] border border-gray-700 text-xs rounded px-2 py-1"
                      value={t.category || "Uncategorized"}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onUpdateTransaction({
                          ...t,
                          category: e.target.value,
                        })
                      }
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-2 text-gray-100">
                    ${(Number(t.amount) || 0).toFixed(2)}
                  </td>

                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTransaction(t.id);
                      }}
                      className="text-xs text-gray-500 hover:text-red-400"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}

              {sortedTransactions.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No transactions yet. Import a CSV to see them here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL EDITOR */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#101010] rounded-xl p-6 w-full max-w-md shadow-xl space-y-4 border border-red-700">
            <h3 className="text-xl font-semibold mb-2 text-gray-100">
              Edit Transaction
            </h3>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Description</label>
              <input
                type="text"
                className="w-full p-2 rounded bg-black text-gray-100 border border-gray-800"
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Date</label>
              <input
                type="text"
                className="w-full p-2 rounded bg-black text-gray-100 border border-gray-800"
                value={editing.date}
                onChange={(e) =>
                  setEditing({ ...editing, date: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Type</label>
              <select
                className="w-full p-2 rounded bg-black text-gray-100 border border-gray-800"
                value={editing.type}
                onChange={(e) =>
                  setEditing({ ...editing, type: e.target.value })
                }
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="payment">Payment</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Category</label>
              <select
                className="w-full p-2 rounded bg-black text-gray-100 border border-gray-800"
                value={editing.category || "Uncategorized"}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value })
                }
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-300">Amount</label>
              <input
                type="number"
                className="w-full p-2 rounded bg-black text-gray-100 border border-gray-800"
                value={editing.amount}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                className="px-4 py-2 rounded bg-gray-800 text-gray-100 hover:bg-gray-700"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500"
                onClick={() => {
                  const toSave = {
                    ...editing,
                    category:
                      editing.category ||
                      guessCategory(editing.description) ||
                      "Uncategorized",
                  };
                  onUpdateTransaction(toSave);
                  setEditing(null);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
