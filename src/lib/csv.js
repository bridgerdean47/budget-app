// src/lib/csv.js

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

// ⭐ CENTRALIZED CATEGORY GUESSING - this is the ONLY place categories are assigned
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

  // 💳 CREDIT CARD PAYMENTS - BEFORE other checks
  if (
    d.includes("chase credit crd") ||
    d.includes("chase credit card") ||
    d.includes("credit card payment") ||
    d.includes("cc payment") ||
    d.includes("payment thank you")
  ) {
    return "Credit Card Payments";
  }

  // 💰 LOANS
  if (
    d.includes("dept education") ||
    d.includes("student loan") ||
    d.includes("loan payment")
  ) {
    return "Loans";
  }

  // 🔌 BILLS & UTILITIES
  if (
    d.includes("quantum fiber") ||
    d.includes("internet") ||
    d.includes("power company") ||
    d.includes("electric") ||
    d.includes("water") ||
    d.includes("gas & electric") ||
    d.includes("utility")
  ) {
    return "Bills & Utilities";
  }

  // 🛒 GROCERIES
  if (
    d.includes("walmart") ||
    d.includes("wal-mart") ||
    d.includes("wal mart") ||
    d.includes("winco") ||
    d.includes("grocery") ||
    d.includes("safeway") ||
    d.includes("kroger") ||
    d.includes("albertsons")
  ) {
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
    d.includes("cafe") ||
    d.includes("pizza") ||
    d.includes("starbucks") ||
    d.includes("dunkin")
  ) {
    return "Food & Drink";
  }

  // ⛽ GAS
  if (
    d.includes("shell") ||
    d.includes("chevron") ||
    d.includes("gas station") ||
    d.includes("exxon") ||
    d.includes("bp gas")
  ) {
    return "Gas";
  }

  // 🎬 ENTERTAINMENT
  if (
    d.includes("spotify") ||
    d.includes("netflix") ||
    d.includes("hulu") ||
    d.includes("youtube") ||
    d.includes("disney+") ||
    d.includes("hbo") ||
    d.includes("paramount")
  ) {
    return "Entertainment";
  }

  // ✈️ TRAVEL
  if (
    d.includes("flight") ||
    d.includes("hotel") ||
    d.includes("airbnb") ||
    d.includes("airline")
  ) {
    return "Travel";
  }

  // 🐾 PETS
  if (d.includes("pet") || d.includes("vet")) {
    return "Pets";
  }

  // 🛍️ SHOPPING
  if (
    d.includes("amazon") ||
    d.includes("target") ||
    d.includes("dollartree") ||
    d.includes("dollar tree")
  ) {
    return "Shopping";
  }

  // 🏥 INSURANCE (check LAST to avoid false positives)
  if (d.includes("insurance") && !d.includes("apts")) {
    return "Insurance";
  }

  return "Uncategorized";
}

// Helper: determine EPAY transfer-like descriptions
function isEpayTransfer(descLower = "") {
  return (
    descLower.includes("type: epay") ||
    descLower.includes(" epay") ||
    descLower.includes("withdrawal ach chase credit crd")
  );
}

// Map Chase CSV categories into the app's CATEGORY_OPTIONS (keep unknowns as-is)
function normalizeChaseCategory(cat = "") {
  const c = String(cat || "").trim();
  if (!c) return "";

  const k = c.toLowerCase();

  const map = {
    restaurants: "Food & Drink",
    dining: "Food & Drink",
    "food & drink": "Food & Drink",
    groceries: "Groceries",
    gas: "Gas",
    travel: "Travel",
    shopping: "Shopping",
    entertainment: "Entertainment",
    "health & wellness": "Health & Wellness",
    pets: "Pets",
    insurance: "Insurance",
    "bills & utilities": "Bills & Utilities",
    utilities: "Bills & Utilities",
    "credit card payments": "Credit Card Payments",
    payment: "Credit Card Payments",
  };

  return map[k] || c; // keep unknown categories as-is
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

      const lowerDesc = (desc || "").toLowerCase();

      // Use the category pre-selected by Chase when available
      const csvCategory = (get("category") || "").trim();
      const normalizedCsvCategory = normalizeChaseCategory(csvCategory);

      // New rule:
      // - Chase *charges* => type "credit_card" (shows as Credit Card and totals on dashboard)
      // - Chase *payments/credits* => type "transfer" (ex: Payment Thank You / positive amount)
      const isPaymentLike =
  /payment\s*thank\s*you/.test(lowerDesc) ||
  normalizedCsvCategory.toLowerCase() === "credit card payments" ||
  rawAmount > 0;

      const type = isPaymentLike ? "transfer" : "credit_card";

      const category =
        normalizedCsvCategory && normalizedCsvCategory.toLowerCase() !== "uncategorized"
          ? normalizedCsvCategory
          : guessCategory(desc);

      out.push({
        id: startId + out.length,
        date: normalizeDate(rawDate),
        description: desc,
        amount: Math.abs(rawAmount),
        type,
        category,
        source: "chase",
      });
      continue;
    }

    /* ---------- FCU (Money Market / Checking) ---------- */
    if (isFcu) {
      const rawDate = get("date");
      const desc = get("description");
      const rawAmount = parseAmount(get("amount"));
      if (!isFinite(rawAmount) || rawAmount === 0) continue;

      const lowerDesc = (desc || "").toLowerCase();
      const lowerCat = (get("category") || "").toLowerCase();

      let type = "expense";

      if (isEpayTransfer(lowerDesc)) {
        type = "transfer";
      } else if (
        lowerDesc.includes("payment thank you") ||
        lowerDesc.includes("credit card payment") ||
        lowerDesc.includes("cc payment") ||
        lowerDesc.includes("chase credit crd") ||
        lowerDesc.includes("credit card")
      ) {
        type = "transfer";
      } else if (rawAmount > 0) {
        type = lowerCat.includes("transfer") || lowerDesc.includes("transfer") ? "transfer" : "income";
      } else {
        type = lowerCat.includes("transfer") || lowerDesc.includes("transfer") ? "transfer" : "expense";
      }

      out.push({
        id: startId + out.length,
        date: normalizeDate(rawDate),
        description: desc,
        amount: Math.abs(rawAmount),
        type,
        category: guessCategory(desc),
        source: "fcu",
      });
      continue;
    }

    /* ---------- ICCU ---------- */
    if (isIccu) {
      const rawDate = get("posting date") || get("effective date");
      const desc = get("description");
      const rawAmount = parseAmount(get("amount"));
      if (!isFinite(rawAmount) || rawAmount === 0) continue;

      const transType = (get("transaction type") || "").toLowerCase();
      const typeField = (get("type") || "").toLowerCase();
      const lowerDesc = (desc || "").toLowerCase();
      const lowerCat = (get("transaction category") || "").toLowerCase();

      let type = "expense";

      if (isEpayTransfer(lowerDesc)) {
        type = "transfer";
      } else if (transType.includes("deposit") || typeField.includes("deposit") || rawAmount > 0) {
        type = "income";
      } else if (lowerCat.includes("transfer") || transType.includes("transfer") || lowerDesc.includes("transfer")) {
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
        category: guessCategory(desc),
        source: "iccu",
      });
      continue;
    }

    /* ---------- Generic: Type, Description, Amount, Date ---------- */
    if (isTypeDescAmountDate) {
      const typeRaw = (cells[0]?.trim() || "").toLowerCase();
      const desc = cells[1]?.trim() || "";
      const rawAmount = parseAmount(cells[2] || "");
      const dateStr = cells[3]?.trim() || "";
      if (!isFinite(rawAmount) || rawAmount === 0) continue;

      const lowerDesc = desc.toLowerCase();

      let type = "expense";

      if (isEpayTransfer(lowerDesc)) type = "transfer";
      else if (typeRaw === "income") type = "income";
      else if (typeRaw === "payment") type = "transfer";
      else if (typeRaw === "transfer") type = "transfer";
      else if (rawAmount > 0) type = "income";

      if (lowerDesc.includes("payment thank you")) {
        type = "transfer";
      }

      out.push({
        id: startId + out.length,
        date: normalizeDate(dateStr),
        description: desc,
        amount: Math.abs(rawAmount),
        type,
        category: guessCategory(desc),
        source: "generic",
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
      if (isEpayTransfer(d)) {
        type = "transfer";
      } else if (
        d.includes("payment thank you") ||
        d.includes("credit card payment") ||
        d.includes("cc payment") ||
        d.includes("chase credit crd")
      ) {
        type = "transfer";
      } else {
        type = rawAmount > 0 ? "income" : "expense";
      }

      out.push({
        id: startId + out.length,
        date: normalizeDate(dateStr),
        description: desc,
        amount: Math.abs(rawAmount),
        type,
        category: guessCategory(desc),
        source: "generic",
      });
      continue;
    }
  }

  return out;
}