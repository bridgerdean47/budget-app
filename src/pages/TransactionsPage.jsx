
import { useState, useMemo, useRef } from "react";
import { parseCsv } from "../lib/csv";


export default function TransactionsPage({
  theme,
  cardClass,
  transactions,
  onAddTransactions,
  onUpdateTransaction,
  onDeleteTransaction,
  onClearTransactions,
}) {
  const [editing, setEditing] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const fileInputRef = useRef(null);

  const handleFileSelected = (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setImportMessage("Please choose a .csv file.");
      return;
    }

    setImportMessage(`Reading ${file.name}...`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = parseCsv(text, transactions.length);
      if (!parsed.length) {
        setImportMessage("No valid rows found in CSV.");
      } else {
        onAddTransactions(parsed);
        setImportMessage(
          `Imported ${parsed.length} transactions from ${file.name}.`
        );
      }
    };
    reader.onerror = () => {
      setImportMessage("Error reading file.");
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    handleFileSelected(droppedFile);
  };

  const handleSortClick = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedTransactions = useMemo(() => {
    const data = [...transactions];
    if (!sortConfig.key) return data;

    if (sortConfig.key === "date") {
      data.sort((a, b) => {
        const da = a.date ? new Date(a.date) : new Date(0);
        const db = b.date ? new Date(b.date) : new Date(0);
        const cmp = da - db;
        return sortConfig.direction === "asc" ? cmp : -cmp;
      });
    }

    return data;
  }, [transactions, sortConfig]);

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <span className="text-[0.6rem] text-gray-500">⇅</span>;
    }
    return (
      <span className="text-[0.6rem] text-gray-300">
        {sortConfig.direction === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
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

      {/* IMPORT CARD */}
      <section className={cardClass}>
        <h3 className="text-xs font-semibold tracking-[0.28em] text-red-400">
          BANK STATEMENT IMPORT (CSV)
        </h3>

        <p className="mt-3 text-xs text-gray-400">
          Supported formats:
          <br />
          1) Type, Description, Amount, Date
          <br />
          2) Date, Description, Amount
          <br />
          3) Chase credit card CSV
        </p>

        <div className="mt-4 space-y-3 text-xs">
          {/* Drag & drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={
              "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-6 cursor-pointer transition " +
              (isDragging
                ? "border-red-400 bg-red-500/10"
                : "border-red-700 bg-black/40 hover:border-red-500 hover:bg-red-500/5")
            }
          >
            <p className="text-gray-200 font-medium mb-1">
              Drag &amp; drop a CSV file here
            </p>
            <p className="text-gray-400">
              or <span className="text-red-300 underline">click to browse</span>
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) =>
                handleFileSelected(e.target.files?.[0] || null)
              }
            />
          </div>

          {importMessage && (
            <p className="text-[0.7rem] text-gray-400">{importMessage}</p>
          )}
        </div>
      </section>

      {/* TABLE CARD */}
      <section className={cardClass}>
        <h3 className="mb-3 text-sm font-medium text-red-300">
          Imported transactions ({transactions.length})
        </h3>

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
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Amount</th>
                <th className="px-4 py-3 text-center font-semibold">Del</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setEditing(t)}
                  className="cursor-pointer border-b border-gray-800 transition-colors transform hover:bg-[#111111] hover:translate-x-1"
                >
                  <td className="px-4 py-2 text-gray-200">{t.date}</td>
                  <td className="px-4 py-2 text-gray-100">
                    {t.description}
                  </td>
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
                  <td className="px-4 py-2 text-gray-100">
                    ${t.amount.toFixed(2)}
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
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL EDITOR (unchanged) */}
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
                  onUpdateTransaction(editing);
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