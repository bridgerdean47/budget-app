// basic CSV line splitter that handles quotes
function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
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

  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let [, mm, dd, yy] = m;
    mm = mm.padStart(2, "0");
    dd = dd.padStart(2, "0");
    if (yy.length === 2) yy = "20" + yy;
    return `${yy}-${mm}-${dd}`;
  }

  return str;
}

function parseAmount(str) {
  if (!str) return NaN;
  const cleaned = str.replace(/[$,]/g, "").trim();
  if (!cleaned) return NaN;
  return parseFloat(cleaned);
}

// ⭐ CENTRALIZED CATEGORY GUESSING - runs for ALL imports
function guessCategory(desc = "") {
  if (!desc) return "Uncategorized";
  
  const d = desc.toLowerCase();

  // 🏠 RENT - HIGHEST PRIORITY (check first!)
  if (
    d.includes("apts anderson") ||
    d.includes("apts ander") ||
    d.includes("ach apts") ||
    d.includes("withdrawal ach apts") ||
    d.includes("apartment") ||
    d.includes(" apts ") ||
    d.startsWith("apts ") ||
    d.includes(" rent") ||
    d.startsWith("rent") ||
    d.includes("lease")
  ) {
    return "Rent";
  }

  // 💳 CREDIT CARD PAYMENTS
  if (
    d.includes("chase credit crd") ||
    d.includes("credit card payment") ||
    d.includes("cc payment") ||
    d.includes("payment thank you")
  ) {
    return "Credit Card Payments";
  }

  // 💰 LOANS
  if (d.includes("dept education") || d.includes("student loan")) {
    return "Loans";
  }

  // 🔌 BILLS & UTILITIES
  if (
    d.includes("quantum fiber") ||
    d.includes("internet") ||
    d.includes("power") ||
    d.includes("electric") ||
    d.includes("water") ||
    d.includes("gas & electric")
  ) {
    return "Bills & Utilities";
  }

  // 🛒 GROCERIES
  if (d.includes("walmart") || d.includes("grocery") || d.includes("winco")) {
    return "Groceries";
  }

  // 🍔 FOOD & DRINK
  if (
    d.includes("mcdonald") ||
    d.includes("taco bell") ||
    d.includes("burger king") ||
    d.includes("wendy") ||
    d.includes("subway") ||
    d.includes("restaurant") ||
    d.includes("cafe")
  ) {
    return "Food & Drink";
  }

  // ⛽ GAS
  if (d.includes("shell") || d.includes("chevron") || d.includes("gas ")) {
    return "Gas";
  }

  // 🎬 ENTERTAINMENT
  if (
    d.includes("spotify") ||
    d.includes("netflix") ||
    d.includes("hulu") ||
    d.includes("youtube")
  ) {
    return "Entertainment";
  }

  // ✈️ TRAVEL
  if (d.includes("flight") || d.includes("hotel") || d.includes("airbnb")) {
    return "Travel";
  }

  // 🐾 PETS
  if (d.includes("pet") || d.includes("vet")) {
    return "Pets";
  }

  // 🛍️ SHOPPING
  if (d.includes("amazon") || d.includes("target")) {
    return "Shopping";
  }

  // 🏥 INSURANCE (check LAST to avoid false positives)
  if (d.includes("insurance") && !d.includes("apts")) {
    return "Insurance";
  }

  return "Uncategorized";
}

export function parseCsv(text, startId = 0) {
  if (!text) return [];

  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  const headerCells = splitCsvLine(lines[0]).map((c) => c.trim().toLowerCase());

  // Detect formats
  const isChase =
    headerCells.includes("transaction date") &&
    headerCells.includes("description") &&
    headerCells.includes("category") &&
    headerCells.includes("amount");

  const isFcu =
    headerCells.includes("account id") &&
    headerCells.includes("transaction id") &&
    headerCells.includes("date") &&
    headerCells.includes("description") &&
    headerCells.includes("amount");

  const isIccu =
    headerCells.includes("posting date") &&
    headerCells.includes("description") &&
    headerCells.includes("transaction category") &&
    headerCells.includes("amount");

  const isTypeDescAmountDate =
    headerCells[0] === "type" &&
    headerCells[1] === "description" &&
    headerCells[2] === "amount";

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
      const rawAmount = parseAmount(get("amount"));
      if (!isFinite(rawAmount) || rawAmount === 0) continue;

      let type;
      const rawType = get("type").toLowerCase();
      if (rawType === "payment" || rawAmount > 0) {
        type = "payment";
      } else {
        type = "expense";
      }

      if (desc.toLowerCase().includes("payment thank you")) {
        type = "payment";
      }

      out.push({
        id: startId + out.length,
        date: normalizeDate(rawDate),
        description: desc,
        amount: Math.abs(rawAmount),
        type,
        category: guessCategory(desc), // ⭐ Use centralized guesser
      });
      continue;
    }

    /* ---------- FCU (Money Market / Checking) ---------- */
    if (isFcu) {
      const rawDate = get("date");
      const desc = get("description");
      const rawAmount = parseAmount(get("amount"));
      if (!isFinite(rawAmount) || rawAmount === 0) continue;

      const lowerDesc = desc.toLowerCase();
      const lowerCat = (get("category") || "").toLowerCase();

      let type = "expense";

      // ⭐ CHECK FOR CREDIT CARD PAYMENTS FIRST
      if (
        lowerDesc.includes("chase credit crd") ||
        lowerDesc.includes("credit card") ||
        lowerDesc.includes("epay")
      ) {
        type = "payment";
      } else if (rawAmount > 0) {
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
        category: guessCategory(desc), // ⭐ Use centralized guesser
      });
      continue;
    }

    /* ---------- ICCU ---------- */
    if (isIccu) {
      const rawDate = get("posting date") || get("effective date");
      const desc = get("description");
      const rawAmount = parseAmount(get("amount"));
      if (!isFinite(rawAmount) || rawAmount === 0) continue;

      const transType = get("transaction type").toLowerCase();
      const typeField = get("type").toLowerCase();
      const lowerDesc = desc.toLowerCase();
      const lowerCat = (get("transaction category") || "").toLowerCase();

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
        category: guessCategory(desc), // ⭐ Use centralized guesser
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
        category: guessCategory(desc), // ⭐ Use centralized guesser
      });
      continue;
    }

    /* ---------- Generic: Date, Description, Amount ---------- */
    if (isDateDescAmount) {
      const dateStr = cells[0]?.trim() || "";
      const desc = cells[1]?.trim() || "";
      const amountStr = (cells[2] || "").replace(/,/g, "");
      const rawAmount = parseFloat(amountStr);
      if (!isFinite(rawAmount) || rawAmount === 0) continue;

      const d = desc.toLowerCase();

      let type;
      if (
        d.includes("chase credit crd") ||
        d.includes("credit card payment") ||
        d.includes("cc payment") ||
        d.includes("epay")
      ) {
        type = "payment";
      } else {
        type = rawAmount > 0 ? "income" : "expense";
      }

      out.push({
        id: startId + out.length,
        date: normalizeDate(dateStr),
        description: desc,
        amount: Math.abs(rawAmount),
        type,
        category: guessCategory(desc), // ⭐ Use centralized guesser
      });
      continue;
    }
  }

  return out;
}