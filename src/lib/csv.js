// basic CSV line splitter that handles quotes
function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      // toggle quote state, but handle double quotes inside quoted text
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function normalizeDate(str) {
  if (!str) return "";

  // mm/dd/yyyy or m/d/yyyy(/yy)
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let [, mm, dd, yy] = m;
    mm = mm.padStart(2, "0");
    dd = dd.padStart(2, "0");
    if (yy.length === 2) yy = "20" + yy;
    return `${yy}-${mm}-${dd}`; // YYYY-MM-DD
  }

  // already in ISO or something else – just return
  return str;
}

function parseAmount(str) {
  if (!str) return NaN;
  // remove $ and commas, keep sign
  const cleaned = str.replace(/[$,]/g, "").trim();
  if (!cleaned) return NaN;
  return parseFloat(cleaned);
}

export function parseCsv(text, startId = 0) {
  if (!text) return [];

  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  const headerCells = splitCsvLine(lines[0]).map((c) => c.trim().toLowerCase());

  // Detect Chase credit card CSV
  const isChase =
    headerCells.includes("transaction date") &&
    headerCells.includes("description") &&
    headerCells.includes("category") &&
    headerCells.includes("amount");

  // Detect FCU CSV (Money Market / Checking)
  // Account ID, Transaction ID, Date, Description, Check Number, Category, Tags, Amount, Balance
  const isFcu =
    headerCells.includes("account id") &&
    headerCells.includes("transaction id") &&
    headerCells.includes("date") &&
    headerCells.includes("description") &&
    headerCells.includes("amount");

  // Detect ICCU CSV
  // Transaction ID, Posting Date, Effective Date, Transaction Type, Amount, ..., Description, Transaction Category, Type, Balance...
  const isIccu =
    headerCells.includes("posting date") &&
    headerCells.includes("description") &&
    headerCells.includes("transaction category") &&
    headerCells.includes("amount");

  // Generic format 1: Type, Description, Amount, Date
  const isTypeDescAmountDate =
    headerCells[0] === "type" &&
    headerCells[1] === "description" &&
    headerCells[2] === "amount";

  // Generic format 2: Date, Description, Amount
  const isDateDescAmount =
    headerCells[0] === "date" &&
    headerCells[1] === "description" &&
    headerCells[2] === "amount";

  const out = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cells = splitCsvLine(line);

    const get = (name) => {
      const idx = headerCells.indexOf(name);
      if (idx === -1) return "";
      return (cells[idx] ?? "").trim();
    };

    /* ---------- Chase credit card ---------- */
    if (isChase) {
      const rawDate = get("transaction date") || get("post date");
      const desc = get("description");
      const category = get("category") || "Uncategorized";
      const rawAmount = parseAmount(get("amount"));
      if (!isFinite(rawAmount) || rawAmount === 0) continue;

      let type;
      const rawType = get("type").toLowerCase();
      if (rawType === "payment" || rawAmount > 0) {
        type = "payment";
      } else {
        type = "expense";
      }

      // special-case your “Payment Thank You-Mobile” as Payment
      if (desc.toLowerCase().includes("payment thank you")) {
        type = "payment";
      }

      out.push({
        id: startId + out.length,
        date: normalizeDate(rawDate),
        description: desc,
        amount: Math.abs(rawAmount),
        type,
        category,
      });
      continue;
    }

    /* ---------- FCU (Money Market / Checking) ---------- */
    if (isFcu) {
      const rawDate = get("date");
      const desc = get("description");
      const category = get("category") || "Uncategorized";
      const rawAmount = parseAmount(get("amount"));
      if (!isFinite(rawAmount) || rawAmount === 0) continue;

      let type = "expense";
      // transfers & deposits based on description / category / sign
      const lowerDesc = desc.toLowerCase();
      const lowerCat = category.toLowerCase();

      if (rawAmount > 0) {
        // money in
        if (lowerCat.includes("transfer") || lowerDesc.includes("transfer")) {
          type = "transfer";
        } else {
          type = "income";
        }
      } else {
        // money out
        if (lowerCat.includes("transfer") || lowerDesc.includes("transfer")) {
          type = "transfer";
        } else {
          type = "expense";
        }
      }

      out.push({
        id: startId + out.length,
        date: normalizeDate(rawDate),
        description: desc,
        amount: Math.abs(rawAmount),
        type,
        category,
      });
      continue;
    }

    /* ---------- ICCU ---------- */
    if (isIccu) {
      const rawDate = get("posting date") || get("effective date");
      const desc = get("description");
      const category = get("transaction category") || "Uncategorized";
      const rawAmount = parseAmount(get("amount"));
      if (!isFinite(rawAmount) || rawAmount === 0) continue;

      const transType = get("transaction type").toLowerCase();
      const typeField = get("type").toLowerCase();
      const lowerDesc = desc.toLowerCase();
      const lowerCat = category.toLowerCase();

      let type = "expense";

      if (
        transType.includes("deposit") ||
        typeField.includes("deposit") ||
        rawAmount > 0
      ) {
        type = "income";
      } else if (
        lowerCat.includes("transfer") ||
        transType.includes("transfer") ||
        lowerDesc.includes("transfer")
      ) {
        type = "transfer";
      } else {
        type = "expense";
      }

      out.push({
        id: startId + out.length,
        date: normalizeDate(rawDate),
        description: desc,
        amount: Math.abs(rawAmount),
        type,
        category,
      });
      continue;
    }

    /* ---------- Generic: Type, Description, Amount, Date ---------- */
    if (isTypeDescAmountDate) {
      const typeRaw = cells[0]?.trim().toLowerCase();
      const desc = cells[1]?.trim() || "";
      const rawAmount = parseAmount(cells[2] || "");
      const dateStr = cells[3]?.trim() || "";
      if (!isFinite(rawAmount) || rawAmount === 0) continue;

      let type = "expense";
      if (typeRaw === "income") type = "income";
      else if (typeRaw === "payment") type = "payment";
      else if (typeRaw === "transfer") type = "transfer";
      else if (rawAmount > 0) type = "income";

      if (desc.toLowerCase().includes("payment thank you")) {
        type = "payment";
      }

      out.push({
        id: startId + out.length,
        date: normalizeDate(dateStr),
        description: desc,
        amount: Math.abs(rawAmount),
        type,
        category: "Uncategorized",
      });
      continue;
    }

    /* ---------- Generic: Date, Description, Amount ---------- */
    if (isDateDescAmount) {
      const dateStr = cells[0]?.trim() || "";
      const desc = cells[1]?.trim() || "";
      const rawAmount = parseAmount(cells[2] || "");
      if (!isFinite(rawAmount) || rawAmount === 0) continue;

      const type = rawAmount > 0 ? "income" : "expense";

      out.push({
        id: startId + out.length,
        date: normalizeDate(dateStr),
        description: desc,
        amount: Math.abs(rawAmount),
        type,
        category: "Uncategorized",
      });
      continue;
    }

    // fallback: skip unknown formats
  }

  return out;
}
