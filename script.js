// Budget Dashboard with Tailwind + dates + CSV import

// Each transaction:
// { id, type: "income" | "expense", description, amount, date }

let transactions = [];

// Load from localStorage on page load
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("transactions");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      transactions = parsed.map((t) => ({
        ...t,
        date: t.date || todayString()
      }));
    } catch (e) {
      console.error("Failed to parse transactions from localStorage", e);
      transactions = [];
    }
  }
  render();
});

// DOM references
const form = document.getElementById("transaction-form");
const typeSelect = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");

const totalIncomeEl = document.getElementById("total-income");
const totalExpensesEl = document.getElementById("total-expenses");
const balanceEl = document.getElementById("balance");
const transactionListEl = document.getElementById("transaction-list");

// CSV import elements
const bankFileInput = document.getElementById("bank-file");
const importBtn = document.getElementById("import-btn");

// Helper: today's date as YYYY-MM-DD
function todayString() {
  return new Date().toISOString().slice(0, 10);
}

// Normalize date: if blank, use today
function normalizeDate(raw) {
  if (!raw) return todayString();
  return raw;
}

// Handle manual form submit
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const type = typeSelect.value;
  const description = descriptionInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const date = normalizeDate(dateInput.value);

  if (!description || isNaN(amount) || amount <= 0) {
    alert("Please enter a valid description and amount.");
    return;
  }

  const newTransaction = {
    id: Date.now(),
    type,
    description,
    amount,
    date
  };

  transactions.push(newTransaction);

  // Clear inputs (leave date so user doesn't reselect)
  descriptionInput.value = "";
  amountInput.value = "";

  saveAndRender();
});

// CSV import button
if (importBtn && bankFileInput) {
  importBtn.addEventListener("click", () => {
    const file = bankFileInput.files[0];
    if (!file) {
      alert("Please choose a CSV file first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      importCsvText(text);
    };
    reader.readAsText(file);
  });
}

// Save to localStorage
function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Render summary + table
function render() {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  totalIncomeEl.textContent = `$${totalIncome.toFixed(2)}`;
  totalExpensesEl.textContent = `$${totalExpenses.toFixed(2)}`;
  balanceEl.textContent = `$${balance.toFixed(2)}`;

  transactionListEl.innerHTML = "";

  transactions.forEach((t) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-700 hover:bg-slate-800/60";

    const typeTd = document.createElement("td");
    typeTd.textContent = t.type === "income" ? "Income" : "Expense";
    typeTd.className =
      "px-3 py-2 " +
      (t.type === "income" ? "text-emerald-400" : "text-rose-400");

    const descTd = document.createElement("td");
    descTd.textContent = t.description;
    descTd.className = "px-3 py-2 text-slate-100";

    const dateTd = document.createElement("td");
    dateTd.textContent = t.date || "";
    dateTd.className = "px-3 py-2 text-slate-300";

    const amountTd = document.createElement("td");
    amountTd.textContent = `$${t.amount.toFixed(2)}`;
    amountTd.className = "px-3 py-2 text-slate-100";

    const deleteTd = document.createElement("td");
    deleteTd.className = "px-3 py-2 text-right";
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className =
      "px-2.5 py-1 text-xs rounded-md bg-rose-600 text-white hover:bg-rose-700 transition";
    deleteBtn.addEventListener("click", () => {
      deleteTransaction(t.id);
    });
    deleteTd.appendChild(deleteBtn);

    tr.appendChild(typeTd);
    tr.appendChild(descTd);
    tr.appendChild(dateTd);
    tr.appendChild(amountTd);
    tr.appendChild(deleteTd);

    transactionListEl.appendChild(tr);
  });
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  saveAndRender();
}

function saveAndRender() {
  saveTransactions();
  render();
}

// CSV import supporting two formats:
// Format A: Type,Description,Amount,Date (Type = Income/Expense, Amount > 0)
// Format B: Date,Description,Amount (Amount > 0 => income, Amount < 0 => expense)
function importCsvText(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length <= 1) {
    alert("CSV file seems to be empty.");
    return;
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const typeIdx = headers.indexOf("type");
  const descIdx = headers.indexOf("description");
  const amountIdx = headers.indexOf("amount");
  const dateIdx = headers.indexOf("date");

  const hasTypeColumn = typeIdx !== -1;

  if (descIdx === -1 || amountIdx === -1) {
    alert(
      'CSV must have at least "Description" and "Amount", plus either "Type" or "Date" headers.'
    );
    return;
  }

  if (!hasTypeColumn && dateIdx === -1) {
    alert(
      'Supported formats:\n' +
        '1) Type,Description,Amount,Date\n' +
        '2) Date,Description,Amount'
    );
    return;
  }

  let importedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(",");
    if (cols.length < 3) continue;

    const description = cols[descIdx].trim();
    if (!description) continue;

    const rawAmount = cols[amountIdx].trim();
    let amountVal = parseFloat(rawAmount);
    if (isNaN(amountVal) || amountVal === 0) continue;

    const rawDate = dateIdx !== -1 ? cols[dateIdx].trim() : "";
    const date = normalizeDate(rawDate);

    let type;

    if (hasTypeColumn) {
      // Format A: Type,Description,Amount,Date
      const rawType = cols[typeIdx].trim().toLowerCase();
      if (rawType === "income") {
        type = "income";
      } else if (rawType === "expense") {
        type = "expense";
      } else {
        continue;
      }
      amountVal = Math.abs(amountVal);
    } else {
      // Format B: Date,Description,Amount (sign decides type)
      if (amountVal > 0) {
        type = "income";
      } else {
        type = "expense";
        amountVal = Math.abs(amountVal);
      }
    }

    transactions.push({
      id: Date.now() + i,
      type,
      description,
      amount: amountVal,
      date
    });

    importedCount++;
  }

  if (importedCount === 0) {
    alert("No valid rows found to import.");
    return;
  }

  saveAndRender();
  alert(`Imported ${importedCount} transactions from CSV.`);
}
