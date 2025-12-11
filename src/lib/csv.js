/* ---------- CSV helpers ---------- */

export function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];

    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

export function isIsoDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}

export function parseCsv(text, startId = 0) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];

  const result = [];
  let idCounter = startId + 1;

  let startIndex = 0;
  let headerCols = [];
  let headerLower = [];

  if (lines.length > 0) {
    headerCols = splitCsvLine(lines[0]).map((c) =>
      c.trim().replace(/^"|"$/g, "")
    );
    headerLower = headerCols.map((c) => c.toLowerCase());
  }

  const hasBank1Header =
    headerLower.includes("posting date") &&
    headerLower.includes("transaction type") &&
    headerLower.some((c) => c === "amount" || c.startsWith("amount"));

  let bank1 = null;
  if (hasBank1Header) {
    bank1 = {
      postingIdx: headerLower.indexOf("posting date"),
      txnTypeIdx: headerLower.indexOf("transaction type"),
      amountIdx: headerLower.findIndex(
        (c) => c === "amount" || c.startsWith("amount")
      ),
      descIdx: (() => {
        let idx = headerLower.findIndex((c) =>
          c.includes("extended description")
        );
        if (idx === -1)
          idx = headerLower.findIndex((c) => c === "description");
        return idx;
      })(),
    };
  }

  const hasBank2Header =
    headerLower.includes("account id") &&
    headerLower.includes("transaction id") &&
    headerLower.includes("date") &&
    headerLower.some((c) => c === "amount" || c.startsWith("amount"));

  let bank2 = null;
  if (hasBank2Header) {
    bank2 = {
      dateIdx: headerLower.indexOf("date"),
      descIdx: headerLower.indexOf("description"),
      amountIdx: headerLower.findIndex(
        (c) => c === "amount" || c.startsWith("amount")
      ),
    };
  }

  const hasChaseHeader =
    headerLower.includes("transaction date") &&
    headerLower.includes("description") &&
    headerLower.includes("amount");

  let chase = null;
  if (hasChaseHeader) {
    chase = {
      dateIdx: headerLower.indexOf("transaction date"),
      descIdx: headerLower.indexOf("description"),
      amountIdx: headerLower.indexOf("amount"),
      typeIdx: headerLower.indexOf("type"),
    };
  }

  const hasSimpleHeader =
    headerLower.includes("type") &&
    headerLower.some((c) => c.startsWith("description")) &&
    headerLower.some((c) => c.startsWith("amount")) &&
    headerLower.some((c) => c.startsWith("date"));

  const hasDateDescAmountHeader =
    headerLower.includes("date") &&
    headerLower.some((c) => c.startsWith("description")) &&
    headerLower.some((c) => c.startsWith("amount"));

  if (
    hasBank1Header ||
    hasBank2Header ||
    hasChaseHeader ||
    hasSimpleHeader ||
    hasDateDescAmountHeader
  ) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    const cols = splitCsvLine(raw).map((c) =>
      c.trim().replace(/^"|"$/g, "")
    );
    if (cols.length < 3) continue;

    /* Bank format 1 */
    if (bank1) {
      const { postingIdx, txnTypeIdx, amountIdx, descIdx } = bank1;
      if (
        postingIdx < cols.length &&
        txnTypeIdx < cols.length &&
        amountIdx < cols.length
      ) {
        const postingRaw = cols[postingIdx];
        const txnTypeRaw = cols[txnTypeIdx];
        const amountRaw = cols[amountIdx];
        const descRaw =
          descIdx >= 0 && descIdx < cols.length ? cols[descIdx] : "";

        let amount = parseFloat(amountRaw.replace(/,/g, ""));
        if (!Number.isFinite(amount)) continue;

        let date = postingRaw;
        const m = postingRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) {
          const mm = m[1].padStart(2, "0");
          const dd = m[2].padStart(2, "0");
          date = `${m[3]}-${mm}-${dd}`;
        }

        const typeLower = txnTypeRaw.toLowerCase();
        let type =
          typeLower === "credit" || amount > 0 ? "income" : "expense";

        // Detect transfers
        const descLower = descRaw.toLowerCase();
        if (
          descLower.includes("transfer") ||
          descLower.includes("xfer") ||
          descLower.includes("share transfer") ||
          descLower.includes("online banking transfer") ||
          descLower.includes("member to member")
        ) {
          type = "transfer";
        }

        result.push({
          id: idCounter++,
          date,
          description: descRaw,
          type,
          amount: Math.abs(amount),
        });
      }
      continue;
    }

    /* Bank format 2 */
    if (bank2) {
      const { dateIdx, descIdx, amountIdx } = bank2;
      if (
        dateIdx < cols.length &&
        amountIdx < cols.length &&
        descIdx < cols.length
      ) {
        const dateRaw = cols[dateIdx];
        const descRaw = cols[descIdx];
        const amountCell = cols[amountIdx];

        const negative = amountCell.includes("(");
        const cleaned = amountCell.replace(/[\$,()]/g, "");
        let amount = parseFloat(cleaned);
        if (!Number.isFinite(amount)) continue;
        if (negative) amount = -amount;

        let date = dateRaw;
        const m = dateRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) {
          const mm = m[1].padStart(2, "0");
          const dd = m[2].padStart(2, "0");
          date = `${m[3]}-${mm}-${dd}`;
        }

        let type = amount >= 0 ? "income" : "expense";

        const descLower = descRaw.toLowerCase();
        if (
          descLower.includes("transfer") ||
          descLower.includes("xfer") ||
          descLower.includes("share transfer") ||
          descLower.includes("online banking transfer") ||
          descLower.includes("member to member")
        ) {
          type = "transfer";
        }

        result.push({
          id: idCounter++,
          date,
          description: descRaw,
          type,
          amount: Math.abs(amount),
        });
      }
      continue;
    }

    /* Chase credit card */
    if (chase) {
      const { dateIdx, descIdx, amountIdx, typeIdx } = chase;

      if (
        dateIdx < cols.length &&
        descIdx < cols.length &&
        amountIdx < cols.length
      ) {
        const dateRaw = cols[dateIdx];
        const descRaw = cols[descIdx];
        const amountRaw = cols[amountIdx];
        const typeRaw =
          typeIdx >= 0 && typeIdx < cols.length ? cols[typeIdx] : "";

        let amount = parseFloat(amountRaw.replace(/,/g, ""));
        if (!Number.isFinite(amount)) continue;

        let date = dateRaw;
        const m = dateRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) {
          const mm = m[1].padStart(2, "0");
          const dd = m[2].padStart(2, "0");
          date = `${m[3]}-${mm}-${dd}`;
        }

        const descLower = descRaw.toLowerCase();
        const typeLower = typeRaw.toLowerCase();
        let type = "expense";

        if (
          descLower.includes("refund") ||
          descLower.includes("credit") ||
          typeLower.includes("refund") ||
          typeLower.includes("credit")
        ) {
          type = "income";
        } else if (descLower.includes("payment")) {
          // e.g. "Payment Thank You-Mobile"
          type = "payment";
        }

        if (
          descLower.includes("transfer") ||
          descLower.includes("xfer") ||
          descLower.includes("balance transfer")
        ) {
          type = "transfer";
        }

        result.push({
          id: idCounter++,
          date,
          description: descRaw,
          type,
          amount: Math.abs(amount),
        });
      }
      continue;
    }

    /* Simple format A: Type, Description, Amount, Date */
    const firstLower = cols[0].toLowerCase();
    if (
      (firstLower === "income" ||
        firstLower === "expense" ||
        firstLower === "payment" ||
        firstLower === "transfer") &&
      cols.length >= 4
    ) {
      const [typeRaw, desc, amountRaw, dateRaw] = cols;
      let amount = parseFloat(amountRaw.replace(/,/g, ""));
      if (!Number.isFinite(amount)) continue;

      let type = "expense";
      const tLower = typeRaw.toLowerCase();
      if (tLower === "income") type = "income";
      else if (tLower === "payment") type = "payment";
      else if (tLower === "transfer") type = "transfer";

      const descLower = desc.toLowerCase();
      if (
        descLower.includes("transfer") ||
        descLower.includes("xfer") ||
        descLower.includes("share transfer") ||
        descLower.includes("online banking transfer") ||
        descLower.includes("member to member")
      ) {
        type = "transfer";
      }

      const date = dateRaw;

      result.push({
        id: idCounter++,
        date,
        description: desc,
        type,
        amount: Math.abs(amount),
      });
      continue;
    }

    /* Simple format B: Date, Description, Amount (YYYY-MM-DD) */
    if (isIsoDate(cols[0])) {
      const [dateRaw, desc, amountRaw] = cols;
      let amount = parseFloat(amountRaw.replace(/,/g, ""));
      if (!Number.isFinite(amount)) continue;

      let type = amount >= 0 ? "income" : "expense";

      const descLower = desc.toLowerCase();
      if (
        descLower.includes("transfer") ||
        descLower.includes("xfer") ||
        descLower.includes("share transfer") ||
        descLower.includes("online banking transfer") ||
        descLower.includes("member to member")
      ) {
        type = "transfer";
      }

      const date = dateRaw;

      result.push({
        id: idCounter++,
        date,
        description: desc,
        type,
        amount: Math.abs(amount),
      });
      continue;
    }

    /* Fallback format C: Description, 20251130:xxxx, Amount */
    if (/^\d{8}:/.test(cols[1])) {
      const desc = cols[0];
      const code = cols[1];
      const amountRaw = cols[2];

      let amount = parseFloat(amountRaw.replace(/,/g, ""));
      if (!Number.isFinite(amount)) continue;

      const dateDigits = code.slice(0, 8);
      const date =
        dateDigits.slice(0, 4) +
        "-" +
        dateDigits.slice(4, 6) +
        "-" +
        dateDigits.slice(6, 8);

      let type = amount >= 0 ? "income" : "expense";

      const descLower = desc.toLowerCase();
      if (
        descLower.includes("transfer") ||
        descLower.includes("xfer") ||
        descLower.includes("share transfer") ||
        descLower.includes("online banking transfer") ||
        descLower.includes("member to member")
      ) {
        type = "transfer";
      }

      result.push({
        id: idCounter++,
        date,
        description: desc,
        type,
        amount: Math.abs(amount),
      });
      continue;
    }
  }

  return result;
}