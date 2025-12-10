export function parseBankCsv(rows) {
  if (!rows || rows.length === 0) return [];

  const headerMap = normalizeHeaders(Object.keys(rows[0]));

  return rows.map((row) => ({
    date: row[headerMap.date] || null,
    description: row[headerMap.description] || "",
    amount: parseFloat(row[headerMap.amount]) || 0,
    type: row[headerMap.type] || "unknown",
  }));
}

function normalizeHeaders(headers) {
  const map = {};

  const lower = headers.map(h => h.toLowerCase());

  // Chase format
  if (lower.includes("transaction date")) map.date = "Transaction Date";
  if (lower.includes("description")) map.description = "Description";
  if (lower.includes("amount")) map.amount = "Amount";
  if (lower.includes("type")) map.type = "Type";

  // Add other formats below later (Amex, Discover, banks, credit unions)
  // Example:
  // if (lower.includes("date")) map.date = "date_posted";

  return map;
}
