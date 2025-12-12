import { useState, useMemo, useRef } from "react";
import { parseCsv } from "../lib/csv";

export default function MiniTransactionsWidget({
  cardClass,
  transactions,
  imports,
  onAddTransactions,
  onDeleteTransaction,
  onClearTransactions,
  onDeleteImportBatch,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const fileInputRef = useRef(null);

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
    const parsed = parseCsv(text, transactions.length + allParsed.length);
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
    setImportMessage(`Imported ${allParsed.length} transactions from ${files.length} file(s).`);
  }

  if (fileInputRef.current) fileInputRef.current.value = "";
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

handleFilesSelected(e.dataTransfer.files);
  };

  const sortedTransactions = useMemo(() => {
    const data = [...transactions];
    data.sort((a, b) => {
      const da = a.date ? new Date(a.date) : new Date(0);
      const db = b.date ? new Date(b.date) : new Date(0);
      return db - da; // newest first
    });
    return data;
  }, [transactions]);

  return (
    <section className={cardClass}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold tracking-[0.28em] text-red-400">
          QUICK IMPORT & RECENT TRANSACTIONS
        </h3>
        <button
          type="button"
          onClick={onClearTransactions}
          className="text-[0.7rem] px-3 py-1 rounded-full border border-gray-600 text-gray-300 hover:border-red-500 hover:text-red-300"
        >
          Clear All
        </button>
      </div>

      {/* Drag/drop area */}
      <div className="mb-4 text-xs">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={
            "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-4 cursor-pointer transition " +
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
          <p className="mt-2 text-[0.7rem] text-gray-400">
            {importMessage}
          </p>
        )}
      </div>
{/* Imported CSV batches */}
{Array.isArray(imports) && imports.length > 0 && (
  <div className="mb-4 rounded-2xl border border-red-900/60 bg-black/30 p-3">
    <div className="mb-2 text-[0.7rem] font-semibold tracking-[0.28em] text-red-400">
      IMPORT HISTORY
    </div>

    <div className="space-y-2 text-xs">
      {imports.slice(0, 8).map((b) => (
        <div key={b.id} className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-gray-200 truncate">
              {(b.files || []).map((f) => f.name).join(", ")}
            </div>
            <div className="text-[0.7rem] text-gray-400">
              {new Date(b.importedAt).toLocaleString()} • {b.count} tx
            </div>
          </div>

          <button
            type="button"
            onClick={() => onDeleteImportBatch?.(b.id)}
            className="shrink-0 text-[0.7rem] px-3 py-1 rounded-full border border-gray-600 text-gray-300 hover:border-red-500 hover:text-red-300"
          >
            Delete import
          </button>
        </div>
      ))}
    </div>
  </div>
)}

      {/* Scrollable transactions list */}
      <div className="overflow-x-auto max-h-64 rounded-2xl border border-red-900/60">
        <table className="w-full text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-[#111111] text-gray-200 border-b border-red-900">
              <th className="px-3 py-2 text-left font-semibold">Date</th>
              <th className="px-3 py-2 text-left font-semibold">
                Description
              </th>
              <th className="px-3 py-2 text-left font-semibold">Type</th>
              <th className="px-3 py-2 text-right font-semibold">Amount</th>
              <th className="px-3 py-2 text-center font-semibold">Del</th>
            </tr>
          </thead>
          <tbody>
{sortedTransactions.map((t, i) => (
  <tr
    key={`${t.id}-${i}`}
                className="border-b border-gray-800 last:border-b-0"
              >
                <td className="px-3 py-2 text-gray-300 whitespace-nowrap">
                  {t.date}
                </td>
                <td className="px-3 py-2 text-gray-100">
                  {t.description}
                </td>
                <td
                  className={
                    "px-3 py-2 whitespace-nowrap " +
                    (t.type === "income"
                      ? "text-green-400"
                      : t.type === "payment"
                      ? "text-yellow-300"
                      : t.type === "transfer"
                      ? "text-blue-400"
                      : "text-red-400")
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
                <td className="px-3 py-2 text-right text-gray-100">
                  ${(Number(t.amount) || 0).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => onDeleteTransaction(t.id)}
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
                  colSpan={5}
                  className="px-3 py-4 text-center text-gray-500"
                >
                  No transactions yet. Import a CSV to see them here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}